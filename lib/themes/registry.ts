export interface ThemeDefinition {
    id: string;
    name: string;
    description: string;
    previewImage: string;
    colors: {
        primary: string;
        accent: string;
        background: string;
    };
}

export const THEME_REGISTRY: ThemeDefinition[] = [
    {
        id: "duxa-dark",
        name: "Duxa Dark",
        description: "Modern ve şık koyu tema. Gece kullanımı için optimize edilmiştir.",
        previewImage: "/themes/previews/duxa-dark.webp",
        colors: {
            primary: "#18181b",
            accent: "#3f3f46",
            background: "#09090b"
        }
    },
    {
        id: "duxa-light",
        name: "Duxa Light",
        description: "Temiz ve aydınlık görünüm. Gün ışığında yüksek okunabilirlik sağlar.",
        previewImage: "/themes/previews/duxa-light.webp",
        colors: {
            primary: "#ffffff",
            accent: "#f4f4f5",
            background: "#fafafa"
        }
    },
    {
        id: "duxa-gold",
        name: "Duxa Gold",
        description: "Premium ve lüks hissiyat veren altın detaylı özel tema.",
        previewImage: "/themes/previews/duxa-gold.webp",
        colors: {
            primary: "#0f172a",
            accent: "#eab308",
            background: "#020617"
        }
    },
    {
        id: "duxa-emerald",
        name: "Duxa Emerald",
        description: "Doğa dostu, taze ve modern zümrüt yeşili paleti.",
        previewImage: "/themes/previews/duxa-emerald.webp",
        colors: {
            primary: "#064e3b",
            accent: "#10b981",
            background: "#022c22"
        }
    }
];
