using System.Linq;
using EXFIN.TallyMapper.Tally.Parsers;
using Xunit;

namespace EXFIN.TallyMapper.Tests.Tally
{
    public class TallyXmlResponseParserTests
    {
        private readonly TallyXmlResponseParser _parser = new TallyXmlResponseParser();

        [Fact]
        public void CanParse_ValidTallyXml_ReturnsTrue()
        {
            string xml = "<ENVELOPE><HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER><BODY></BODY></ENVELOPE>";
            Assert.True(_parser.CanParse(xml));
        }

        [Fact]
        public void CanParse_InvalidText_ReturnsFalse()
        {
            string json = "{\"status\": \"ok\"}";
            Assert.False(_parser.CanParse(json));
        }

        [Fact]
        public void ParseCompanies_ExtractsCompaniesFromXml()
        {
            string xml = @"<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <DATA>
      <COLLECTION>
        <COMPANY>
          <NAME>ABC TRADING PVT LTD</NAME>
          <GUID>GUID-123456</GUID>
          <STARTINGFROM>01-04-2026</STARTINGFROM>
          <ENDINGAT>31-03-2027</ENDINGAT>
        </COMPANY>
        <COMPANY>
          <NAME>XYZ ENTERPRISES</NAME>
          <GUID>GUID-789012</GUID>
          <STARTINGFROM>01-04-2026</STARTINGFROM>
          <ENDINGAT>31-03-2027</ENDINGAT>
        </COMPANY>
      </COLLECTION>
    </DATA>
  </BODY>
</ENVELOPE>";

            var companies = _parser.ParseCompanies(xml);
            Assert.Equal(2, companies.Count);
            Assert.Equal("ABC TRADING PVT LTD", companies[0].Name);
            Assert.Equal("GUID-123456", companies[0].Guid);
            Assert.Equal("XYZ ENTERPRISES", companies[1].Name);
        }

        [Fact]
        public void ParseResponse_WithTallyLineError_ReturnsFailure()
        {
            string errorXml = "<ENVELOPE><LINEERROR>Function 'UnknownFunc' not supported.</LINEERROR></ENVELOPE>";
            var response = _parser.ParseResponse(errorXml);

            Assert.False(response.Success);
            Assert.Equal("TALLY_ERROR", response.Status);
            Assert.Contains("Function 'UnknownFunc' not supported", response.Message);
        }
    }
}
