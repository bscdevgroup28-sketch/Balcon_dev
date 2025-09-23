// Firebase Configuration Stub - LOCAL DEVELOPMENT ONLY
// This is a placeholder for future Firebase integration if needed

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Local stub configuration - not connected to any external services
export const firebaseConfig: FirebaseConfig = {
  apiKey: "local-stub-key",
  authDomain: "localhost",
  projectId: "balcon-local",
  storageBucket: "local-storage",
  messagingSenderId: "000000000",
  appId: "local-app-id"
};

const firebaseStub = {};
export default firebaseStub;