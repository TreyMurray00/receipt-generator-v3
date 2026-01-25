# Receipt V3 🧾

A powerful, local-first mobile application for creating and managing business receipts. Built with Expo, React Native, and Drizzle ORM.

## ✨ Features

- **Receipt Management**: Create, view, and track professional receipts for your customers.
- **Business Profiles**: Configure your business name, address, logo, and digital signature.
- **Line Items**: Add multiple items with quantities and prices to each receipt.
- **Local History**: View a dashboard of all past receipts with convenient date filtering.
- **Electronic Signatures**: Capture business signatures directly within the app.
- **Offline First**: All data is stored locally using SQLite for maximum performance and privacy.
- **PDF Generation**: Easily print or share receipts (supported via Expo Print/Sharing).

## 🚀 Tech Stack

- **Framework**: [Expo](https://expo.dev/) (SDK 54)
- **Frontend**: [React Native](https://reactnative.dev/) with [TypeScript](https://www.typescriptlang.org/)
- **UI Library**: [RNUILib](https://wix.github.io/react-native-ui-lib/) (Wix React Native UI Lib)
- **Database (ORM)**: [Drizzle ORM](https://orm.drizzle.team/)
- **Storage**: [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite-next/)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **Icons**: [@expo/vector-icons](https://docs.expo.dev/guides/icons/)

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)
- [Expo Go](https://expo.dev/go) app on your mobile device (to test on physical hardware)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd receipt-v3
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npx expo start
   ```

### Database Migrations

This project uses Drizzle for database management. To push schema changes to the local SQLite database:

```bash
npx drizzle-kit push
```

## 📁 Project Structure

- `app/`: Contains the application routes (Expo Router).
- `components/`: Reusable UI components.
- `db/`: Database schema definitions (`schema.ts`) and client configuration.
- `constants/`: Global constants and theme definitions.
- `hooks/`: Custom React hooks.
- `assets/`: Static assets like images and fonts.
- `drizzle/`: Database migration files.

## 📱 Development

- **Android**: `npm run android`
- **iOS**: `npm run ios`
- **Web**: `npm run web`

## 📄 License

This project is open source and intended for internal use.

