using System;
using System.Collections.Generic;
using System.Xml.Linq;
using EXFIN.TallyMapper.Tally.Interfaces;
using EXFIN.TallyMapper.Tally.Models;

namespace EXFIN.TallyMapper.Tally.Parsers
{
    public class TallyXmlResponseParser : ITallyResponseParser
    {
        public string SupportedFormat => "XML";

        public bool CanParse(string responseBody)
        {
            if (string.IsNullOrWhiteSpace(responseBody)) return false;
            string trimmed = responseBody.Trim();
            return trimmed.StartsWith("<") && (trimmed.Contains("ENVELOPE") || trimmed.Contains("RESPONSE") || trimmed.Contains("TALLY") || trimmed.Contains("COMPANY"));
        }

        public TallyResponse ParseResponse(string responseBody)
        {
            var response = new TallyResponse
            {
                Format = "XML",
                RawPreview = responseBody.Length > 4096 ? responseBody.Substring(0, 4096) : responseBody
            };

            if (!CanParse(responseBody))
            {
                response.Success = false;
                response.Status = "INVALID_FORMAT";
                response.Message = "Response is not valid Tally XML.";
                return response;
            }

            try
            {
                var doc = XDocument.Parse(responseBody);
                var root = doc.Root;

                if (root != null)
                {
                    // Check for Tally error response elements
                    var lineError = root.Element("LINEERROR")?.Value;
                    if (!string.IsNullOrEmpty(lineError))
                    {
                        response.Success = false;
                        response.Status = "TALLY_ERROR";
                        response.Message = lineError;
                        return response;
                    }

                    response.Success = true;
                    response.Status = "OK";
                    response.Message = "Valid Tally XML response parsed.";
                    response.Data = doc;
                }
            }
            catch (Exception ex)
            {
                response.Success = false;
                response.Status = "PARSING_ERROR";
                response.Message = $"XML Parse Error: {ex.Message}";
            }

            return response;
        }

        public List<TallyCompany> ParseCompanies(string responseBody)
        {
            var companies = new List<TallyCompany>();
            if (string.IsNullOrWhiteSpace(responseBody)) return companies;

            try
            {
                var doc = XDocument.Parse(responseBody);
                var root = doc.Root;
                if (root == null) return companies;

                // Look for current company
                var currentCompanyVal = root.Element("HEADER")?.Element("CURRENTCOMPANY")?.Value
                                      ?? root.Element("BODY")?.Element("DATA")?.Element("SVCURRENTCOMPANY")?.Value;

                // Method 1: Look for <COMPANY> or <COLLECTION><COMPANY> elements
                var companyNodes = doc.Descendants("COMPANY");
                int index = 1;
                foreach (var node in companyNodes)
                {
                    var name = node.Element("NAME")?.Value 
                              ?? node.Element("COMPANYNAME")?.Value 
                              ?? node.Attribute("NAME")?.Value;

                    if (!string.IsNullOrWhiteSpace(name))
                    {
                        var company = new TallyCompany
                        {
                            Id = node.Element("GUID")?.Value ?? $"COMP_{index++}",
                            Name = name.Trim(),
                            Guid = node.Element("GUID")?.Value,
                            BooksFrom = node.Element("BOOKSFROM")?.Value ?? node.Element("STARTINGFROM")?.Value,
                            FinancialYearFrom = node.Element("FINANCIALYEARFROM")?.Value ?? node.Element("STARTINGFROM")?.Value,
                            FinancialYearTo = node.Element("FINANCIALYEARTO")?.Value ?? node.Element("ENDINGAT")?.Value,
                            RawIdentifier = node.ToString(SaveOptions.DisableFormatting),
                            IsActive = string.Equals(name.Trim(), currentCompanyVal?.Trim(), StringComparison.OrdinalIgnoreCase)
                        };

                        if (!companies.Exists(c => c.Name.Equals(company.Name, StringComparison.OrdinalIgnoreCase)))
                        {
                            companies.Add(company);
                        }
                    }
                }

                // Method 2: If no <COMPANY> tags, check for <COMPANYNAME> or <SVCURRENTCOMPANY> direct nodes
                if (companies.Count == 0 && !string.IsNullOrWhiteSpace(currentCompanyVal))
                {
                    companies.Add(new TallyCompany
                    {
                        Id = "CURRENT_COMP",
                        Name = currentCompanyVal.Trim(),
                        IsActive = true,
                        IsSelected = true
                    });
                }
            }
            catch
            {
                // Return empty list if XML parsing fails for companies
            }

            return companies;
        }
    }
}
