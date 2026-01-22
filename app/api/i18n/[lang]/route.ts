import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * API endpoint to serve i18n JSON files
 * GET /api/i18n/en -> returns en.json content
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { lang: string } }
) {
    try {
        const { lang } = params;

        // Validate language code (security)
        const validLangs = ["en", "de", "fr", "lb", "tr", "me", "mt", "ru"];
        if (!validLangs.includes(lang)) {
            return NextResponse.json(
                { error: "Invalid language code" },
                { status: 400 }
            );
        }

        // Read the JSON file from i18n directory
        const filePath = path.join(process.cwd(), "i18n", `${lang}.json`);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return NextResponse.json(
                { error: `Translation file for ${lang} not found` },
                { status: 404 }
            );
        }

        // Read and parse the file
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const jsonData = JSON.parse(fileContent);

        // Return JSON with proper headers
        return NextResponse.json(jsonData, {
            headers: {
                "Cache-Control": "public, max-age=3600", // Cache for 1 hour
            },
        });
    } catch (error) {
        console.error("Error reading i18n file:", error);
        return NextResponse.json(
            { error: "Failed to load translation file" },
            { status: 500 }
        );
    }
}
