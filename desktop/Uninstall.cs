using System;using System.IO;using System.Reflection;using System.Windows.Forms;using Microsoft.Win32;
class Uninstall {
 [STAThread] static void Main(){
  if(MessageBox.Show("Remover o aplicativo Duelist Kingdom deste computador?\n\nOs torneios no banco de dados online e seu perfil local serão preservados.","Desinstalar Duelist Kingdom",MessageBoxButtons.YesNo,MessageBoxIcon.Question)!=DialogResult.Yes)return;
  try{string meta=Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);string root=Path.GetFullPath(File.ReadAllText(Path.Combine(meta,"install-path.txt")).Trim()).TrimEnd(Path.DirectorySeparatorChar);
   if(!root.EndsWith(Path.DirectorySeparatorChar+"Duelist Kingdom",StringComparison.OrdinalIgnoreCase)||!File.Exists(Path.Combine(root,".duelist-kingdom-install")))throw new Exception("Não foi possível validar a pasta instalada.");
   Directory.Delete(root,true);string[] links={Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs),"Duelist Kingdom.lnk"),Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory),"Duelist Kingdom.lnk")};foreach(var link in links)if(File.Exists(link))File.Delete(link);
   Registry.CurrentUser.DeleteSubKeyTree(@"Software\Microsoft\Windows\CurrentVersion\Uninstall\DuelistKingdomDesktop",false);File.Delete(Path.Combine(meta,"install-path.txt"));MessageBox.Show("Duelist Kingdom foi removido. Seus registros online foram preservados.","Duelist Kingdom");
  }catch(Exception error){MessageBox.Show(error.Message+"\n\nFeche o aplicativo e tente novamente.","Duelist Kingdom",MessageBoxButtons.OK,MessageBoxIcon.Error);}
 }
}
