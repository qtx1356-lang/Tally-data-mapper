using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using EXFIN.TallyMapper.Core.Models;
using EXFIN.TallyMapper.Tally.Models;

namespace EXFIN.TallyMapper.Tally.Interfaces
{
    public interface ITallyConnector
    {
        string Protocol { get; }
        string ConnectorId { get; }
        string SupportedProduct { get; }
        bool ReadOnlyMode { get; }

        Task<bool> ConnectAsync(TallyConnectionProfile profile, CancellationToken cancellationToken = default);
        Task DisconnectAsync(CancellationToken cancellationToken = default);
        Task<TallyConnectionResult> TestConnectionAsync(TallyConnectionProfile profile, CancellationToken cancellationToken = default);
        Task<TallyVersionInfo> GetVersionAsync(TallyConnectionProfile profile, CancellationToken cancellationToken = default);
        Task<List<TallyCompany>> GetCompanyInformationAsync(TallyConnectionProfile profile, CancellationToken cancellationToken = default);
        Task<NormalizedTallyResponse> ExecuteReadRequestAsync(TallyReadRequest request, CancellationToken cancellationToken = default);
        Task<TallyCapabilities> GetCapabilitiesAsync(TallyConnectionProfile profile, CancellationToken cancellationToken = default);
        Task<TallyHealthStatus> GetHealthAsync(TallyConnectionProfile profile, CancellationToken cancellationToken = default);
    }

    public interface ITallyRequestBuilder
    {
        TallyReadRequest BuildCompanyRequest(string correlationId);
        TallyReadRequest BuildCollectionRequest(string collectionName, List<string> methods, string correlationId);
        TallyReadRequest BuildObjectRequest(string objectType, string objectId, List<string> fields, string correlationId);
        bool ValidateReadOnly(string requestPayload, out string rejectionReason);
    }

    public interface ITallyResponseReceiver
    {
        long MaxResponseSizeBytes { get; }
        Task<NormalizedTallyResponse> ReceiveAndParseAsync(System.IO.Stream responseStream, string contentType, string correlationId, CancellationToken cancellationToken = default);
    }

    public interface ITallyObjectNormalizer
    {
        NormalizedObject Normalize(string objectType, object rawData, string sourcePath);
        NormalizedField NormalizeField(string fieldName, object rawValue, string objectType, string sourcePath);
    }

    public interface ISchemaInferenceEngine
    {
        InferredSchema InferSchema(List<NormalizedObject> sampleRecords, string companyId);
        string ComputeSchemaSignature(InferredSchema schema);
    }
}
