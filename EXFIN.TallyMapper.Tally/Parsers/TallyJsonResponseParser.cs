using System;
using System.Collections.Generic;
using System.Text.Json;
using EXFIN.TallyMapper.Tally.Interfaces;
using EXFIN.TallyMapper.Tally.Models;

namespace EXFIN.TallyMapper.Tally.Parsers
{
    public class TallyJsonResponseParser : ITallyResponseParser
    {
        public string SupportedFormat => "JSON";

        public bool CanParse(string responseBody)
        {
            if (string.IsNullOrWhiteSpace(responseBody)) return false;
            string trimmed = responseBody.Trim();
            return (trimmed.StartsWith("{") && trimmed.EndsWith("}")) || (trimmed.StartsWith("[") && trimmed.EndsWith("]"));
        }

        public TallyResponse ParseResponse(string responseBody)
        {
            var response = new TallyResponse
            {
                Format = "JSON",
                RawPreview = responseBody.Length > 4096 ? responseBody.Substring(0, 4096) : responseBody
            };

            if (!CanParse(responseBody))
            {
                response.Success = false;
                response.Status = "INVALID_FORMAT";
                response.Message = "Response is not valid JSON.";
                return response;
            }

            try
            {
                using var jsonDoc = JsonDocument.Parse(responseBody);
                response.Success = true;
                response.Status = "OK";
                response.Message = "Valid JSON response parsed.";
            }
            catch (Exception ex)
            {
                response.Success = false;
                response.Status = "PARSING_ERROR";
                response.Message = $"JSON Parse Error: {ex.Message}";
            }

            return response;
        }

        public List<TallyCompany> ParseCompanies(string responseBody)
        {
            var companies = new List<TallyCompany>();
            if (string.IsNullOrWhiteSpace(responseBody) || !CanParse(responseBody)) return companies;

            try
            {
                using var jsonDoc = JsonDocument.Parse(responseBody);
                var root = jsonDoc.RootElement;

                if (root.ValueKind == JsonValueKind.Array)
                {
                    int index = 1;
                    foreach (var elem in root.EnumerateArray())
                    {
                        if (elem.TryGetProperty("name", out var nameProp) || elem.TryGetProperty("Name", out nameProp))
                        {
                            var name = nameProp.GetString();
                            if (!string.IsNullOrWhiteSpace(name))
                            {
                                companies.Add(new TallyCompany
                                {
                                    Id = elem.TryGetProperty("guid", out var g) ? g.GetString() : $"COMP_{index++}",
                                    Name = name.Trim(),
                                    Guid = elem.TryGetProperty("guid", out var g2) ? g2.GetString() : null,
                                    BooksFrom = elem.TryGetProperty("booksFrom", out var bf) ? bf.GetString() : null,
                                    FinancialYearFrom = elem.TryGetProperty("financialYearFrom", out var fyf) ? fyf.GetString() : null,
                                    FinancialYearTo = elem.TryGetProperty("financialYearTo", out var fyt) ? fyt.GetString() : null,
                                    IsActive = elem.TryGetProperty("isActive", out var ia) && ia.GetBoolean()
                                });
                            }
                        }
                    }
                }
            }
            catch
            {
                // Return empty list on parse error
            }

            return companies;
        }
    }
}
