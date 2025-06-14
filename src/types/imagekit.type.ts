export interface AuthenticatorType {
    signature: string;
    expire: number;
    token: string;
    publicKey: string;
}

export interface UploadResponseType {
    fileType: string;
    thumbnailUrl: string;
    url: string;
}