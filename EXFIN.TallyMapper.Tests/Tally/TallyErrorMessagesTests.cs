using EXFIN.TallyMapper.Core.Enums;
using EXFIN.TallyMapper.Core.Utilities;
using Xunit;

namespace EXFIN.TallyMapper.Tests.Tally
{
    public class TallyErrorMessagesTests
    {
        [Fact]
        public void GetFriendlyMessage_TallyNotRunning_ReturnsUserFriendlyExplanation()
        {
            string msg = TallyErrorMessages.GetFriendlyMessage(TallyErrorCode.TALLY_NOT_RUNNING, "localhost", 9000);
            Assert.Contains("TallyPrime could not be reached", msg);
            Assert.Contains("localhost:9000", msg);
            Assert.DoesNotContain("NullReferenceException", msg);
        }

        [Fact]
        public void GetFriendlyMessage_ConnectionRefused_ReturnsPortDetails()
        {
            string msg = TallyErrorMessages.GetFriendlyMessage(TallyErrorCode.CONNECTION_REFUSED, "192.168.1.50", 9000);
            Assert.Contains("refused at 192.168.1.50:9000", msg);
        }
    }
}
