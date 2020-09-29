const { BlobServiceClient } = require("@azure/storage-blob")

const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING)

const containerClient = blobServiceClient.getContainerClient("img");

module.exports = containerClient;