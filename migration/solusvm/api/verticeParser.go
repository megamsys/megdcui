package api

import (
  "time"
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
    LastName: *clts.FirstName,
    Password:   b64.StdEncoding.EncodeToString([]byte(RandStringRunes(6))),
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
/*
func parseAssemblies() () {
  Id          string   `json:"id" cql:"id"`
	AccountsId  string   `json:"org_id" cql:"org_id"`
	JsonClaz    string   `json:"json_claz" cql:"json_claz"`
	Name        string   `json:"name" cql:"name"`
	AssemblysId []string `json:"assemblies" cql:"assemblies"`
	Inputs      []string `json:"inputs" cql:"inputs"`
	CreatedAt   string   `json:"created_at" cql:"created_at"`

   | ORG8018443203247765368
   | AMS4939192166567098733
   | ['ASM5627540267783389064']
   | 2016-04-01 04:40:59 +0000
   |   null
   |  Megam::Assemblies
   |
}

func parseAssembly() () {
  Id         string   `json:"id" cql:"id"`
	OrgId      string   `json:"org_id" cql:"org_id"`
	AccountId  string   `json:"account_id" cql:"account_id"`
	Name       string   `json:"name" cql:"name"`
	JsonClaz   string   `json:"json_claz" cql:"json_claz"`
	Tosca      string   `json:"tosca_type" cql:"tosca_type"`
	Inputs     []string `json:"inputs" cql:"inputs"`
	Outputs    []string `json:"outputs" cql:"outputs"`
	Policies   []string `json:"policies" cql:"policies"`
	Status     string   `json:"status" cql:"status"`
	CreatedAt  string   `json:"created_at" cql:"created_at"`
	Components []string `json:"components" cql:"components"`
  -------

   org_id  | id  | components | created_at  | inputs | json_claz
   | name | outputs| policies | status   | tosca_type

 | ORG8543260529316515313 | ASM5555544443332210000 |       null
 | 2016-04-11 14:30:54 +0000 | ['{"key":"domain","value":"megambox.com"}', '{"key":"sshkey","value":"vs"}', '{"key":"provider","value":"one"}', '{"key":"cpu","value":"1 Core"}', '{"key":"ram","value":"1 GB"}', '{"key":"hdd","value":"24 GB SSD"}']
 | Megam::Assembly |       kvm108 | null |     null | migrated | tosca.torpedo.ubuntu

}
*/
