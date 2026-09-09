using System;
using System.Collections.Generic;

namespace EXFIN.TallyMapper.Export.Models
{
    public class ExportResult
    {
        public bool IsSuccess { get; set; }
        public int RecordsExported { get; set; }
        public string FilePath { get; set; } = string.Empty;
        public TimeSpan Duration { get; set; }
        public List<string> Errors { get; set; } = new();
    }
}
