import mongoose from "mongoose";
import dns from "dns";

const configureLocalDns = () => {
  /**
   * Some Windows / ISP / college-network DNS resolvers
   * answer normal nslookup requests but refuse Node.js
   * SRV lookups used by mongodb+srv://.
   *
   * In development we force reliable public DNS servers.
   *
   * Render / production is left untouched.
   */
  if (
    process.env.NODE_ENV !==
    "production"
  ) {
    try {
      dns.setServers([
        "8.8.8.8",
        "1.1.1.1",
      ]);
    } catch (error) {
      console.warn(
        "Unable to configure custom DNS servers:",
        error.message
      );
    }
  }
};

const connectDB = async () => {
  try {
    configureLocalDns();

    const mongoUri =
      process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error(
        "MONGODB_URI is not configured in server/.env"
      );
    }

    const connection =
      await mongoose.connect(
        mongoUri,
        {
          serverSelectionTimeoutMS:
            10000,
        }
      );

    console.log(
      `MongoDB connected: ${connection.connection.host}`
    );

    return connection;
  } catch (error) {
    console.error(
      "MongoDB connection error:",
      error.message
    );

    process.exit(1);
  }
};

export default connectDB;