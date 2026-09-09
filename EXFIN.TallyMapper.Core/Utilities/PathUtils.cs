using System;
using System.IO;

namespace EXFIN.TallyMapper.Core.Utilities
{
    public static class PathUtils
    {
        public static string AppDataFolder =>
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "EXFIN", "TallyDataMapper");

        public static string LogsFolder =>
            Path.Combine(AppDataFolder, "Logs");

        public static string DatabasePath =>
            Path.Combine(AppDataFolder, "exfin_mapper.db");

        public static void EnsureDirectoriesExist()
        {
            if (!Directory.Exists(AppDataFolder))
                Directory.CreateDirectory(AppDataFolder);

            if (!Directory.Exists(LogsFolder))
                Directory.CreateDirectory(LogsFolder);
        }
    }
}
