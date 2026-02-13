import * as FileSystem from 'expo-file-system/legacy';
import { GoogleDriveService } from './googleDrive';

const DB_NAME = 'receipts.db';
const DB_PATH = `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;

export const BackupManager = {
    async getDatabasePath() {
        return DB_PATH;
    },

    async performBackup(accessToken: string) {
        // 1. Check if DB exists
        const fileInfo = await FileSystem.getInfoAsync(DB_PATH);
        if (!fileInfo.exists) {
            throw new Error('Database file not found');
        }

        // 2. Check for existing backup
        const existingFile = await GoogleDriveService.findBackupFile(accessToken);

        // 3. Upload
        const result = await GoogleDriveService.uploadBackup(accessToken, DB_PATH, existingFile?.id);
        return result;
    },

    async performRestore(accessToken: string) {
        // 1. Find backup
        const backupFile = await GoogleDriveService.findBackupFile(accessToken);
        if (!backupFile) {
            throw new Error('No backup found');
        }

        // 2. Download
        // Convert download URL to a local file
        const downloadUrl = `https://www.googleapis.com/drive/v3/files/${backupFile.id}?alt=media`;
        const tempPath = FileSystem.documentDirectory + 'receipts_restore_temp.db';

        // We can't strictly use standard fetch for binary large files easily in RN safely without blob support which is flaky
        // Use FileSystem.downloadAsync
        const downloadResult = await FileSystem.downloadAsync(
            downloadUrl,
            tempPath,
            {
                headers: { Authorization: `Bearer ${accessToken}` }
            }
        );

        if (downloadResult.status !== 200) {
            throw new Error('Failed to download backup file');
        }

        // 3. Replace DB
        // Ensure SQLite folder exists just in case? It should if app ran.
        // Close DB connection if possible? Drizzle/expo-sqlite sync connection might need restart.
        // We will just overwrite. App restart is recommended.

        // Delete existing DB to allow copy
        try {
            await FileSystem.deleteAsync(DB_PATH, { idempotent: true });
        } catch (e) {
            console.log("Error deleting existing DB (might not exist):", e);
        }

        await FileSystem.copyAsync({
            from: tempPath,
            to: DB_PATH
        });

        // Clean up temp
        await FileSystem.deleteAsync(tempPath, { idempotent: true });

        return true;
    }
};
