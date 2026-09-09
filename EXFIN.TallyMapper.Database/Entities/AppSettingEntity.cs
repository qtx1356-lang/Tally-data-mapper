using System.ComponentModel.DataAnnotations;

namespace EXFIN.TallyMapper.Database.Entities
{
    public class AppSettingEntity
    {
        [Key]
        public string Key { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
    }
}
