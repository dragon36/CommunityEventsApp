// =============================================================================
// COMMUNITY EVENTS APP - GLOBAL TYPE DECLARATIONS
// =============================================================================

// React Native global types
declare namespace ReactNative {
  interface PlatformConstants {
    forceTouchAvailable: boolean;
    isTesting: boolean;
    reactNativeVersion: {
      major: number;
      minor: number;
      patch: number;
    };
  }
}

// Global variables
declare const __DEV__: boolean;

// Module declarations for non-typed modules
declare module '*.png' {
  const value: any;
  export default value;
}

declare module '*.jpg' {
  const value: any;
  export default value;
}

declare module '*.jpeg' {
  const value: any;
  export default value;
}

declare module '*.gif' {
  const value: any;
  export default value;
}

declare module '*.webp' {
  const value: any;
  export default value;
}

declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}

declare module '*.ttf' {
  const value: string;
  export default value;
}

declare module '*.json' {
  const value: any;
  export default value;
}

// Jest globals
declare const jest: {
  fn: <T extends (...args: any[]) => any>(implementation?: T) => jest.Mock<T>;
  mock: <T>(moduleName: string, factory: () => T) => void;
  unmock: (moduleName: string) => void;
  resetModules: () => void;
  clearAllMocks: () => void;
  restoreAllMocks: () => void;
  useFakeTimers: () => void;
  useRealTimers: () => void;
  setTimeout: (timeout: number) => void;
  spyOn: <T, K extends keyof T>(object: T, method: K) => jest.SpyInstance;
  Mock: new <T extends (...args: any[]) => any>(implementation?: T) => jest.Mock<T>;
  SpyInstance: new <T extends (...args: any[]) => any>() => jest.SpyInstance<T>;
};

declare namespace jest {
  interface Mock<T extends (...args: any[]) => any> {
    (...args: Parameters<T>): ReturnType<T>;
    mockImplementation: (fn: T) => Mock<T>;
    mockReturnValue: (value: ReturnType<T>) => Mock<T>;
    mockResolvedValue: (value: ReturnType<T>) => Mock<T>;
    mockRejectedValue: (value: any) => Mock<T>;
    mockReturnValueOnce: (value: ReturnType<T>) => Mock<T>;
    mockResolvedValueOnce: (value: ReturnType<T>) => Mock<T>;
    mockRejectedValueOnce: (value: any) => Mock<T>;
    mock: {
      calls: Parameters<T>[];
      instances: ReturnType<T>[];
      invocationCallOrder: number[];
      results: Array<{ type: 'return' | 'throw'; value: any }>;
    };
  }

  interface SpyInstance<T extends (...args: any[]) => any> {
    (...args: Parameters<T>): ReturnType<T>;
    mockImplementation: (fn: T) => SpyInstance<T>;
    mockReturnValue: (value: ReturnType<T>) => SpyInstance<T>;
    mockResolvedValue: (value: ReturnType<T>) => SpyInstance<T>;
    mockRejectedValue: (value: any) => SpyInstance<T>;
    mockRestore: () => void;
  }
}

// React Native Testing Library extensions
declare module '@testing-library/react-native' {
  interface RenderResult {
    toJSON: () => any;
  }
}

// Firebase Admin SDK types
declare namespace admin {
  namespace firestore {
    interface FieldValue {
      arrayUnion(...elements: any[]): FieldValue;
      arrayRemove(...elements: any[]): FieldValue;
      increment(n: number): FieldValue;
      delete(): FieldValue;
      serverTimestamp(): FieldValue;
    }

    interface Timestamp {
      toDate(): Date;
      toMillis(): number;
      isEqual(other: Timestamp): boolean;
    }

    interface GeoPoint {
      latitude: number;
      longitude: number;
    }

    interface DocumentReference<T = DocumentData> {
      id: string;
      path: string;
      parent: CollectionReference<T>;
      collection(path: string): CollectionReference;
      set(data: T, options?: SetOptions): Promise<WriteResult>;
      update(data: UpdateData<T>): Promise<WriteResult>;
      delete(): Promise<WriteResult>;
      get(): Promise<DocumentSnapshot<T>>;
      onSnapshot(options: SnapshotOptions, observer: (snapshot: DocumentSnapshot<T>) => void): () => void;
    }

    interface CollectionReference<T = DocumentData> extends Query<T> {
      id: string;
      path: string;
      parent: DocumentReference | null;
      doc(path?: string): DocumentReference<T>;
      add(data: T): Promise<DocumentReference<T>>;
    }

    interface Query<T = DocumentData> {
      where(fieldPath: string | FieldPath, opStr: WhereFilterOp, value: any): Query<T>;
      orderBy(fieldPath: string | FieldPath, directionStr?: OrderByDirection): Query<T>;
      limit(limit: number): Query<T>;
      startAfter(snapshot: DocumentSnapshot): Query<T>;
      get(): Promise<QuerySnapshot<T>>;
      onSnapshot(options: SnapshotOptions, observer: (snapshot: QuerySnapshot<T>) => void): () => void;
    }

    interface DocumentSnapshot<T = DocumentData> {
      exists: boolean;
      id: string;
      ref: DocumentReference<T>;
      data(): T | undefined;
      get(fieldPath: string | FieldPath): any;
    }

    interface QuerySnapshot<T = DocumentData> {
      size: number;
      empty: boolean;
      docs: QueryDocumentSnapshot<T>[];
      docChanges(): DocumentChange<T>[];
    }

    interface QueryDocumentSnapshot<T = DocumentData> extends DocumentSnapshot<T> {
      data(): T;
    }

    interface WriteResult {
      writeTime: Timestamp;
    }

    interface SetOptions {
      merge?: boolean;
      mergeFields?: (string | FieldPath)[];
    }

    type UpdateData<T> = Partial<T> | { [key: string]: any };
    type DocumentData = { [key: string]: any };
    type WhereFilterOp = '<' | '<=' | '==' | '!=' | '>=' | '>' | 'array-contains' | 'in' | 'not-in' | 'array-contains-any';
    type OrderByDirection = 'asc' | 'desc';
    type SnapshotOptions = { includeMetadataChanges?: boolean };
    type DocumentChange<T = DocumentData> = { type: 'added' | 'removed' | 'modified'; doc: QueryDocumentSnapshot<T>; oldIndex: number; newIndex: number };
  }

  namespace auth {
    interface UserRecord {
      uid: string;
      email: string | null;
      displayName: string | null;
      photoURL: string | null;
      disabled: boolean;
      emailVerified: boolean;
      customClaims: { [key: string]: any } | undefined;
      metadata: UserMetadata;
    }

    interface UserMetadata {
      creationTime: string;
      lastSignInTime: string;
    }

    interface DecodedIdToken {
      uid: string;
      aud: string;
      auth_time: number;
      exp: number;
      iat: number;
      iss: string;
      sub: string;
      firebase: {
        identities: { [key: string]: string[] };
        sign_in_provider: string;
      };
      [key: string]: any;
    }
  }

  namespace messaging {
    interface Message {
      token?: string;
      topic?: string;
      condition?: string;
      notification?: Notification;
      data?: { [key: string]: string };
      android?: AndroidConfig;
      apns?: ApnsConfig;
      webpush?: WebpushConfig;
      fcmOptions?: FcmOptions;
    }

    interface Notification {
      title?: string;
      body?: string;
      imageUrl?: string;
    }

    interface AndroidConfig {
      collapseKey?: string;
      priority?: 'normal' | 'high';
      ttl?: number | string;
      restrictedPackageName?: string;
      data?: { [key: string]: string };
      notification?: AndroidNotification;
      fcmOptions?: AndroidFcmOptions;
    }

    interface AndroidNotification {
      title?: string;
      body?: string;
      icon?: string;
      color?: string;
      sound?: string;
      tag?: string;
      clickAction?: string;
      channelId?: string;
      ttl?: number | string;
      notificationCount?: number;
    }

    interface AndroidFcmOptions {
      analyticsLabel?: string;
    }

    interface ApnsConfig {
      headers?: { [key: string]: string };
      payload?: ApnsPayload;
      fcmOptions?: ApnsFcmOptions;
    }

    interface ApnsPayload {
      aps: Aps;
    }

    interface Aps {
      alert?: string | ApsAlert;
      badge?: number;
      sound?: string | CriticalSound;
      contentAvailable?: boolean;
      mutableContent?: boolean;
      category?: string;
      threadId?: string;
    }

    interface ApsAlert {
      title?: string;
      body?: string;
      titleLocKey?: string;
      titleLocArgs?: string[];
      bodyLocKey?: string;
      bodyLocArgs?: string[];
      actionLocKey?: string;
      launchImage?: string;
    }

    interface CriticalSound {
      critical: boolean;
      name: string;
      volume: number;
    }

    interface ApnsFcmOptions {
      analyticsLabel?: string;
      imageUrl?: string;
    }

    interface WebpushConfig {
      headers?: { [key: string]: string };
      data?: { [key: string]: string };
      notification?: WebpushNotification;
      fcmOptions?: WebpushFcmOptions;
    }

    interface WebpushNotification {
      title?: string;
      body?: string;
      icon?: string;
      badge?: string;
      image?: string;
      vibrate?: number[];
      timestamp?: number;
      badge?: number;
      dir?: 'auto' | 'ltr' | 'rtl';
      renotify?: boolean;
      requireInteraction?: boolean;
      silent?: boolean;
      tag?: string;
      actions?: WebpushAction[];
    }

    interface WebpushAction {
      action: string;
      title: string;
      icon?: string;
    }

    interface WebpushFcmOptions {
      analyticsLabel?: string;
      link?: string;
    }

    interface FcmOptions {
      analyticsLabel?: string;
    }
  }

  namespace storage {
    interface Reference {
      put(data: Blob | Uint8Array | ArrayBuffer, metadata?: UploadMetadata): UploadTask;
      putString(data: string, format?: StringFormat, metadata?: UploadMetadata): UploadTask;
      getDownloadURL(): Promise<string>;
      delete(): Promise<void>;
      getMetadata(): Promise<FullMetadata>;
      updateMetadata(metadata: SettableMetadata): Promise<FullMetadata>;
      listAll(): Promise<ListResult>;
      child(path: string): Reference;
      parent: Reference | null;
      root: Reference;
      bucket: string;
      fullPath: string;
      name: string;
    }

    interface UploadTask {
      snapshot: UploadTaskSnapshot;
      on(event: 'state_changed', next: (snapshot: UploadTaskSnapshot) => void, error?: (error: Error) => void, complete?: () => void): () => void;
      then(onfulfilled?: (snapshot: UploadTaskSnapshot) => any): Promise<any>;
      catch(onrejected?: (error: Error) => any): Promise<any>;
      cancel(): boolean;
      pause(): boolean;
      resume(): boolean;
    }

    interface UploadTaskSnapshot {
      bytesTransferred: number;
      totalBytes: number;
      state: 'running' | 'paused' | 'success' | 'error' | 'canceled';
      ref: Reference;
      metadata: FullMetadata;
      task: UploadTask;
    }

    interface FullMetadata {
      name: string;
      bucket: string;
      fullPath: string;
      size: number;
      contentType: string;
      cacheControl: string;
      contentDisposition: string;
      contentEncoding: string;
      contentLanguage: string;
      md5Hash: string;
      timeCreated: string;
      updated: string;
      customMetadata: { [key: string]: string };
    }

    interface UploadMetadata {
      contentType?: string;
      cacheControl?: string;
      contentDisposition?: string;
      contentEncoding?: string;
      contentLanguage?: string;
      customMetadata?: { [key: string]: string };
    }

    interface SettableMetadata {
      cacheControl?: string;
      contentDisposition?: string;
      contentEncoding?: string;
      contentLanguage?: string;
      customMetadata?: { [key: string]: string };
    }

    type StringFormat = 'raw' | 'base64' | 'base64url' | 'data_url';
    type ListResult = { prefixes: Reference[]; items: Reference[] };
  }

  namespace functions {
    interface HttpsCallableResult {
      data: any;
    }

    interface CallableRequest {
      data: any;
      auth: { uid: string; token: { [key: string]: any } } | undefined;
    }
  }
}

// Extend global for testing
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOnTheScreen(): R;
      toBeVisible(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toHaveTextContent(text: string | RegExp): R;
      toHaveStyle(css: string | object): R;
      toHaveClass(className: string): R;
      toHaveAttribute(attr: string, value?: string): R;
    }
  }
}