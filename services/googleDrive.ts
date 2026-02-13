import * as FileSystem from 'expo-file-system';

const BOUNDARY = 'foo_bar_baz';

interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
}

export const GoogleDriveService = {
    async findBackupFile(accessToken: string) {
        const q = "name = 'receipts_backup.db' and trashed = false";
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );
        const data = await response.json();
        return data.files && data.files.length > 0 ? data.files[0] : null;
    },

    async uploadBackup(accessToken: string, fileUri: string, existingFileId?: string) {
        const fileContent = await FileSystem.readAsStringAsync(fileUri, {
            encoding: 'base64',
        });

        const metadata = {
            name: 'receipts_backup.db',
            mimeType: 'application/x-sqlite3',
        };

        const method = existingFileId ? 'PATCH' : 'POST';
        const url = existingFileId
            ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`
            : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

        const body =
            `--${BOUNDARY}\r\n` +
            `Content-Type: application/json\r\n\r\n` +
            `${JSON.stringify(metadata)}\r\n` +
            `--${BOUNDARY}\r\n` +
            `Content-Type: application/x-sqlite3\r\n` +
            `Content-Transfer-Encoding: base64\r\n\r\n` +
            `${fileContent}\r\n` +
            `--${BOUNDARY}--`;

        const response = await fetch(url, {
            method,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': `multipart/related; boundary=${BOUNDARY}`,
            },
            body,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Google Drive Upload Failed: ${errorText}`);
        }

        return await response.json();
    },

    async downloadBackup(accessToken: string, fileId: string) {
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error('Failed to download backup file');
        }

        // Expo's fetch doesn't support .blob() well in all contexts, but we can use FileSystem.downloadAsync 
        // However, since we are in a service, let's keep it simple. 
        // Better approach for large files in RN is FileSystem.downloadAsync.
        // Let's return the URL and headers so the caller can use downloadAsync if needed, 
        // or just return the text/blob if small. DBs can be large.

        // Actually, let's use FileSystem.downloadAsync in the manager, 
        // so this service helper might just provide the URL builder.
        // But for consistency let's stick to the plan of "finding" the file here
        // and let the caller handle the download mechanics or do it here.

        // For specific download with headers, FileSystem.downloadAsync supports headers.

        return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    }
};
