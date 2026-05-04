import ProductModel from "../models/product.model.js";
import ProductViewModel from "../models/productView.model.js";

const MINUTE_MS = 60 * 1000;
const REPORT_WINDOW_MINUTES = 30;

const COUNTRY_NAMES = {
    US: "United States",
    GB: "United Kingdom",
    IN: "India",
    BR: "Brazil",
    AU: "Australia",
    CA: "Canada",
    DE: "Germany",
    FR: "France",
    AE: "United Arab Emirates",
    SA: "Saudi Arabia",
    SG: "Singapore",
    NL: "Netherlands",
    PK: "Pakistan",
    BD: "Bangladesh",
    LK: "Sri Lanka",
    NP: "Nepal",
    ZA: "South Africa",
    NG: "Nigeria",
    KE: "Kenya",
};

const normalizeCountryCode = (value) => {
    const code = String(value || "").trim().toUpperCase();

    if (code.length === 2) {
        return code;
    }

    return "unknown";
};

const getCountryName = (countryCode) => {
    const normalizedCode = normalizeCountryCode(countryCode);

    if (normalizedCode === "unknown") {
        return "Unknown";
    }

    if (COUNTRY_NAMES[normalizedCode]) {
        return COUNTRY_NAMES[normalizedCode];
    }

    try {
        const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
        return displayNames.of(normalizedCode) || normalizedCode;
    } catch {
        return normalizedCode;
    }
};

const getFlagUrl = (countryCode) => {
    const normalizedCode = normalizeCountryCode(countryCode);

    if (normalizedCode === "unknown") {
        return "https://flagcdn.com/un.svg";
    }

    return `https://flagcdn.com/${normalizedCode.toLowerCase()}.svg`;
};

const toMinuteKey = (date) => {
    const minuteDate = new Date(date);
    minuteDate.setSeconds(0, 0);
    return minuteDate.getTime();
};

const getViewerKey = (view) => String(view?.viewerKey || view?._id || "");

const buildUniqueCountMap = (views) => {
    const map = new Map();

    for (const view of views) {
        const viewerKey = getViewerKey(view);
        if (!viewerKey) {
            continue;
        }

        const countryCode = normalizeCountryCode(view?.countryCode);
        if (!map.has(countryCode)) {
            map.set(countryCode, new Set());
        }

        map.get(countryCode).add(viewerKey);
    }

    return map;
};

const buildCountryChange = (currentCount, previousCount) => {
    if (!previousCount) {
        return currentCount > 0
            ? { percentageChange: 100, changeDirection: "up" }
            : { percentageChange: 0, changeDirection: "up" };
    }

    const rawChange = ((currentCount - previousCount) / previousCount) * 100;
    return {
        percentageChange: Math.abs(Number(rawChange.toFixed(1))),
        changeDirection: rawChange < 0 ? "down" : "up",
    };
};

const getProductScopeFilter = async (req) => {
    if (req.userRole !== "seller") {
        return {};
    }

    return { productOwnerId: req.userId };
};

export const recordProductViewController = async (req, res) => {
    try {
        const productId = String(req.body?.productId || req.query?.productId || "").trim();
        if (!productId) {
            return res.status(400).json({
                message: "Product ID is required",
                error: true,
                success: false,
            });
        }

        const product = await ProductModel.findById(productId).select("createdBy").lean();
        if (!product) {
            return res.status(404).json({
                message: "Product not found",
                error: true,
                success: false,
            });
        }

        const viewerKey = String(
            req.body?.viewerKey ||
            req.headers["x-viewer-id"] ||
            req.headers["x-session-id"] ||
            req.ip ||
            `anonymous-${Date.now()}`
        ).trim();

        const countryCode = normalizeCountryCode(
            req.body?.countryCode ||
            req.headers["x-country-code"] ||
            req.headers["cf-ipcountry"] ||
            req.headers["x-vercel-ip-country"]
        );

        await ProductViewModel.create({
            productId,
            productOwnerId: product.createdBy || null,
            viewerKey,
            countryCode,
        });

        return res.status(201).json({
            message: "Product view recorded successfully",
            error: false,
            success: true,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error recording product view: " + error.message,
            error: true,
            success: false,
        });
    }
};

export const getUserReportController = async (req, res) => {
    try {
        const scopeFilter = await getProductScopeFilter(req);
        const reportEnd = new Date();
        const reportStart = new Date(reportEnd.getTime() - REPORT_WINDOW_MINUTES * MINUTE_MS);
        const previousReportStart = new Date(reportStart.getTime() - REPORT_WINDOW_MINUTES * MINUTE_MS);

        const [currentViews, previousViews] = await Promise.all([
            ProductViewModel.find({
                ...scopeFilter,
                createdAt: { $gte: reportStart, $lt: reportEnd },
            })
                .select("viewerKey countryCode createdAt")
                .lean(),
            ProductViewModel.find({
                ...scopeFilter,
                createdAt: { $gte: previousReportStart, $lt: reportStart },
            })
                .select("viewerKey countryCode createdAt")
                .lean(),
        ]);

        const uniqueCurrentViewers = new Set(currentViews.map(getViewerKey).filter(Boolean));
        const totalProductViewersLast30Min = uniqueCurrentViewers.size;

        const bucketEnd = new Date(reportEnd);
        bucketEnd.setSeconds(0, 0);
        const bucketStart = new Date(bucketEnd.getTime() - (REPORT_WINDOW_MINUTES - 1) * MINUTE_MS);
        const minuteBuckets = Array.from({ length: REPORT_WINDOW_MINUTES }, () => new Set());
        const bucketIndexByMinute = new Map();

        minuteBuckets.forEach((_, index) => {
            bucketIndexByMinute.set(bucketStart.getTime() + index * MINUTE_MS, index);
        });

        for (const view of currentViews) {
            const viewerKey = getViewerKey(view);
            if (!viewerKey) {
                continue;
            }

            const minuteKey = toMinuteKey(view.createdAt);
            const bucketIndex = bucketIndexByMinute.get(minuteKey);

            if (typeof bucketIndex === "number") {
                minuteBuckets[bucketIndex].add(viewerKey);
            }
        }

        const productViewersPerMinute = minuteBuckets.map((bucket) => bucket.size);

        const currentCountryMap = buildUniqueCountMap(currentViews);
        const previousCountryMap = buildUniqueCountMap(previousViews);
        const countryCodes = new Set([
            ...currentCountryMap.keys(),
            ...previousCountryMap.keys(),
        ]);

        const maxCountryViewCount = Math.max(
            1,
            ...Array.from(currentCountryMap.values()).map((set) => set.size)
        );

        const viewsByCountry = Array.from(countryCodes).map((countryCode) => {
            const currentCount = currentCountryMap.get(countryCode)?.size || 0;
            const previousCount = previousCountryMap.get(countryCode)?.size || 0;
            const { percentageChange, changeDirection } = buildCountryChange(currentCount, previousCount);

            return {
                countryCode,
                countryName: getCountryName(countryCode),
                flagUrl: getFlagUrl(countryCode),
                viewCount: currentCount,
                percentageChange,
                changeDirection,
                progressPercent: Number(((currentCount / maxCountryViewCount) * 100).toFixed(2)),
            };
        }).sort((left, right) => right.viewCount - left.viewCount);

        return res.status(200).json({
            message: "User report fetched successfully",
            error: false,
            success: true,
            data: {
                totalProductViewersLast30Min,
                productViewersPerMinute,
                viewsByCountry,
            },
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error fetching user report: " + error.message,
            error: true,
            success: false,
        });
    }
};