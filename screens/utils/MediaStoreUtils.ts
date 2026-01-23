import { Platform } from "react-native";
import RNFS from "react-native-fs";
import { PermissionsAndroid } from "react-native";
import { Buffer } from "buffer";

export async function insertFileToDownloads(fileName: string, base64Data: string): Promise<string> {
    if (Platform.OS !== "android") {
        throw new Error("insertFileToDownloads is only for Android");
    }

    // Android 10+ scoped storage (no permissions needed)
    const downloadsDir = `${RNFS.DownloadDirectoryPath}/Almasar`;
    await RNFS.mkdir(downloadsDir); // ensure folder exists
    const filePath = `${downloadsDir}/${fileName}`;

    await RNFS.writeFile(filePath, base64Data, "base64");

    // Trigger media scan so file appears in Downloads
    if (Platform.OS === "android") {
        try {
            const MediaScanner = require("react-native").NativeModules.MediaScannerConnection;
            if (MediaScanner && MediaScanner.scanFile) {
                MediaScanner.scanFile(filePath, "application/pdf");
            }
        } catch (err) {
            console.warn("Media scan failed:", err);
        }
    }

    return filePath;
}
