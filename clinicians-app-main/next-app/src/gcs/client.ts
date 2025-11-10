import { Storage } from "@google-cloud/storage";

// Initialize GCS client with credentials
export const gcpStorageClient = new Storage({
  projectId: process.env.GCLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GCP_CLIENT_EMAIL,
    private_key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
});
