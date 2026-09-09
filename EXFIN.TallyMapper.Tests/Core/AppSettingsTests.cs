using EXFIN.TallyMapper.Core.Models;
using Xunit;

namespace EXFIN.TallyMapper.Tests.Core
{
    public class AppSettingsTests
    {
        [Fact]
        public void AppSettings_DefaultValues_AreCorrect()
        {
            var settings = new AppSettings();

            Assert.Equal("localhost", settings.TallyHost);
            Assert.Equal(9000, settings.TallyPort);
            Assert.Equal(10, settings.ConnectionTimeoutSeconds);
            Assert.Equal(100, settings.PreviewRecordLimit);
            Assert.Equal("Information", settings.LogLevel);
            Assert.Equal("Dark", settings.Theme);
            Assert.False(settings.AutoConnect);
            Assert.False(settings.AutoScan);
        }
    }
}
