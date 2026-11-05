using System;
using System.IO;
using System.IO.Compression;
using System.Reflection;
using System.Diagnostics;
using System.Windows.Forms;
using Microsoft.Win32;
using System.Drawing;

class Setup : Form {
 const string Product="Duelist Kingdom";
 TextBox location=new TextBox();Label status=new Label();ProgressBar progress=new ProgressBar();Button install=new Button();Button browse=new Button();CheckBox desktop=new CheckBox();bool busy=false;
 [STAThread] static int Main(string[] args){
  if(args.Length>0&&args[0]=="/verify"){
   try{using(var s=Assembly.GetExecutingAssembly().GetManifestResourceStream("payload.zip"))using(var z=new ZipArchive(s,ZipArchiveMode.Read)){bool app=false,asar=false;foreach(var e in z.Entries){if(e.FullName=="Duelist Kingdom.exe")app=true;if(e.FullName=="resources/app.asar")asar=true;if(e.FullName.Contains(".."))throw new Exception("Invalid entry");}if(!app||!asar)return 2;return z.Entries.Count>10?0:3;}}catch{return 4;}
  }
  Application.EnableVisualStyles();Application.Run(new Setup());return 0;
 }
 Setup(){Text="Instalar Duelist Kingdom · Windows 64 bits";Width=630;Height=375;FormBorderStyle=FormBorderStyle.FixedDialog;MaximizeBox=false;StartPosition=FormStartPosition.CenterScreen;BackColor=Color.FromArgb(28,23,41);ForeColor=Color.FromArgb(238,228,215);Font=new Font("Segoe UI",10);Icon=Icon.ExtractAssociatedIcon(Assembly.GetExecutingAssembly().Location);
  Controls.Add(new Label{Text="DUELIST KINGDOM",Left=28,Top=25,AutoSize=true,Font=new Font("Segoe UI",21,FontStyle.Bold),ForeColor=Color.FromArgb(229,198,126)});
  Controls.Add(new Label{Text="Torneios e rankings dos seus cinco jogos, em uma janela própria.",Left=30,Top=79,Width=560,Height=28});
  Controls.Add(new Label{Text="Pasta de instalação (somente para seu usuário)",Left=30,Top=119,Width=550,Height=25});
  location.SetBounds(30,149,450,28);location.Text=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"Programs","Duelist Kingdom");location.ReadOnly=true;Controls.Add(location);
  browse.Text="Escolher…";browse.SetBounds(488,148,95,29);browse.Click+=(s,e)=>{using(var d=new FolderBrowserDialog()){d.Description="Escolha a pasta-pai; será criada uma subpasta Duelist Kingdom.";if(d.ShowDialog()==DialogResult.OK)location.Text=Path.Combine(d.SelectedPath,"Duelist Kingdom");}};Controls.Add(browse);
  desktop.Text="Criar atalho na área de trabalho";desktop.Checked=true;desktop.SetBounds(30,191,450,25);Controls.Add(desktop);
  status.SetBounds(30,225,550,38);status.Text="Requer internet e uma conta com acesso ao site.";Controls.Add(status);
  progress.SetBounds(30,266,550,13);Controls.Add(progress);
  install.Text="Instalar";install.SetBounds(442,290,140,33);install.BackColor=Color.FromArgb(229,198,126);install.ForeColor=Color.Black;install.Click+=(s,e)=>Install();Controls.Add(install);
  FormClosing+=(s,e)=>{if(busy)e.Cancel=true;};
 }
 void Install(){if(install.Text=="Concluir"){Close();return;}busy=true;install.Enabled=false;browse.Enabled=false;desktop.Enabled=false;
  try{
   string root=Path.GetFullPath(location.Text).TrimEnd(Path.DirectorySeparatorChar);if(!root.EndsWith(Path.DirectorySeparatorChar+Product,StringComparison.OrdinalIgnoreCase))throw new Exception("Pasta inválida.");
   if(Directory.Exists(root)&&Directory.GetFileSystemEntries(root).Length>0&&!File.Exists(Path.Combine(root,".duelist-kingdom-install")))throw new Exception("A pasta escolhida já contém outros arquivos. Selecione outra pasta-pai.");
   Directory.CreateDirectory(root);
   using(var stream=Assembly.GetExecutingAssembly().GetManifestResourceStream("payload.zip"))using(var zip=new ZipArchive(stream,ZipArchiveMode.Read)){
    progress.Maximum=zip.Entries.Count;int i=0;
    foreach(var entry in zip.Entries){string target=Path.GetFullPath(Path.Combine(root,entry.FullName.Replace('/',Path.DirectorySeparatorChar)));if(!target.StartsWith(root+Path.DirectorySeparatorChar,StringComparison.OrdinalIgnoreCase))throw new Exception("Caminho inválido no pacote.");
     if(entry.Name.Length==0){Directory.CreateDirectory(target);}else{Directory.CreateDirectory(Path.GetDirectoryName(target));using(var source=entry.Open())using(var output=new FileStream(target,FileMode.Create,FileAccess.Write))source.CopyTo(output);}
     progress.Value=++i;status.Text="Instalando arquivos… "+i+" / "+zip.Entries.Count;Application.DoEvents();
    }
   }
   File.WriteAllText(Path.Combine(root,".duelist-kingdom-install"),"Duelist Kingdom 1.1.0");
   string metadata=Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),"DuelistKingdomDesktop");Directory.CreateDirectory(metadata);
   string uninstaller=Path.Combine(metadata,"Desinstalar.exe");using(var source=Assembly.GetExecutingAssembly().GetManifestResourceStream("uninstall.exe"))using(var output=File.Create(uninstaller))source.CopyTo(output);
   File.WriteAllText(Path.Combine(metadata,"install-path.txt"),root);
   string executable=Path.Combine(root,"Duelist Kingdom.exe");Shortcut(executable,Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs),"Duelist Kingdom.lnk"));if(desktop.Checked)Shortcut(executable,Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory),"Duelist Kingdom.lnk"));
   using(var key=Registry.CurrentUser.CreateSubKey(@"Software\Microsoft\Windows\CurrentVersion\Uninstall\DuelistKingdomDesktop")){key.SetValue("DisplayName",Product);key.SetValue("DisplayVersion","1.1.0");key.SetValue("Publisher","Duelist Kingdom");key.SetValue("InstallLocation",root);key.SetValue("DisplayIcon",executable);key.SetValue("UninstallString","\""+uninstaller+"\"");key.SetValue("NoModify",1);key.SetValue("NoRepair",1);}
   status.Text="Instalação concluída. Abra Duelist Kingdom pelo menu Iniciar ou pelo atalho.";install.Text="Concluir";
  }catch(Exception error){status.Text="Não foi possível concluir a instalação.";MessageBox.Show(error.Message+"\n\nFeche o Duelist Kingdom, se estiver aberto, e tente novamente.",Product,MessageBoxButtons.OK,MessageBoxIcon.Error);}
  finally{busy=false;install.Enabled=true;browse.Enabled=true;desktop.Enabled=true;}
 }
 static void Shortcut(string executable,string shortcut){Type type=Type.GetTypeFromProgID("WScript.Shell");object shell=Activator.CreateInstance(type);object link=type.InvokeMember("CreateShortcut",BindingFlags.InvokeMethod,null,shell,new object[]{shortcut});Type lt=link.GetType();lt.InvokeMember("TargetPath",BindingFlags.SetProperty,null,link,new object[]{executable});lt.InvokeMember("WorkingDirectory",BindingFlags.SetProperty,null,link,new object[]{Path.GetDirectoryName(executable)});lt.InvokeMember("Save",BindingFlags.InvokeMethod,null,link,null);}
}
