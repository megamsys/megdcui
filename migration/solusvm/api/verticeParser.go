
package api

import (
  "time"
  "strings"
  b64 "encoding/base64"
  atmn "github.com/megamsys/megdcui/automation"
  "github.com/megamsys/solusvm_go/solusvm"
)


func parseAccount(clts solusvm.SolusClient) (*atmn.Account){
  acts :=  &atmn.Account{
    Id:         "ACT" + RandNumberRunes(19),
    Email: *clts.Email,
    Authority:  "",
    FirstName: *clts.FirstName,
    Api_key:   RandStringRunes(9),
    LastName: *clts.LastName,
    Password:  b64.StdEncoding.EncodeToString([]byte(RandStringRunes(6))),
    Password_reset_key:  "",
    Password_reset_sent_at:  "",
    Phone:      "",
    //Status:     ""
    CreatedAt:  ""+ time.Now().String() +"",
  }
  return acts
}

func parseOrganization(email,company string) (*atmn.Organizations) {
  orgs := &atmn.Organizations{
    Id: "ORG" + RandNumberRunes(19),
  	AccountsId: email,
  	JsonClaz: "Megam::Organizations",
  	Name: company,
  	CreatedAt:  time.Now().String() ,
  }
 return orgs
}

func parseDomains(orgid, domain string) (*atmn.Domains) {
  dmns := &atmn.Domains{
    Id: "DMN" + RandNumberRunes(19),
    OrgId: orgid,
  	JsonClaz: "Megam::Domains",
  	Name: domain,
  	CreatedAt:  time.Now().String() ,
  }
 return dmns

}

func parseAssemblies(orgid, asmid string) (*atmn.Assemblies) {
  ams := &atmn.Assemblies{
  Id: "AMS" + RandNumberRunes(19),
	OrgId: orgid,
	JsonClaz: "Megam::Assemblies",
	Name: "",
	AssemblysId:  []string{""+ asmid +""},
	//Inputs:  nil,
	CreatedAt: time.Now().String(),
  }
  return ams
}

func parseAssembly(orgid string,vm *solusvm.VirtualServer) (*atmn.Ambly) {
  tosca := []string{"ubuntu", "centos","debian"}
  tosca_type := checkToscaType(*vm.Template, tosca...)
  asm := &atmn.Ambly{
    Id: "ASM" + RandNumberRunes(19),
    OrgId: orgid,
    Name: *vm.Ctid_xid,
    JsonClaz:  "Megam::Assembly",
    Tosca: "tosca.torpedo." + tosca_type ,
    Inputs:  []string{"{\"key\":\"domain\",\"value\":\"megambox.com\"}", "{\"key\":\"sshkey\",\"value\":\"\"}", "{\"key\":\"provider\",\"value\":\"one\"}", "{\"key\":\"cpu\",\"value\":\"1 Core\"}", "{\"key\":\"ram\",\"value\":\"1 GB\"}", "{\"key\":\"hdd\",\"value\":\"24 GB SSD\"}", "{\"key\":\"version\",\"value\":\"14.04\"}", "{\"key\":\"lastsuccessstatusupdate\",\"value\":\"01 Apr 16 04:41 UTC\"}", "{\"key\":\"status\",\"value\":\"migrated\"}"},
    Status: "migrated",
    CreatedAt: time.Now().String(),
  }
  return asm
}

func checkToscaType(tmp string, tos ...string) string {
  for i := 0; i < len(tos); i++ {
    template, to := strings.ToUpper(tmp), strings.ToUpper(tos[i])
    if strings.Contains(template, to) {
      return to
    }
	}
  return "ubuntu"
}
