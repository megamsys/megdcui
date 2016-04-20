
package automation

import (

)
type HostInfo struct {
	SolusMaster  string
  Id           string
  Key 				 string
  SolusNode    string
  NodeUser     string
  NodePass     string
	NodeIds      []string
	NodeId			 string
}

type Result struct {
	Status   string
	Statusmsg string
	VirtualServers string
}

type Assemblies struct {
	Id          string   `json:"id" cql:"id"`
	AccountsId  string   `json:"org_id" cql:"org_id"`
	JsonClaz    string   `json:"json_claz" cql:"json_claz"`
	Name        string   `json:"name" cql:"name"`
	AssemblysId []string `json:"assemblies" cql:"assemblies"`
	Inputs      []string `json:"inputs" cql:"inputs"`
	CreatedAt   string   `json:"created_at" cql:"created_at"`
}

type Organizations struct {
	Id          string   `json:"id" cql:"id"`
	AccountsId  string   `json:"accounts_id" cql:"accounts_id"`
	JsonClaz    string   `json:"json_claz" cql:"json_claz"`
	Name        string   `json:"name" cql:"name"`
	CreatedAt   string   `json:"created_at" cql:"created_at"`
}

type Ambly struct {
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
}

type Accounts struct {
	Id         string   `json:"id" cql:"id"`
	Email      string   `json:"email" cql:"email"`
	Authority  string   `json:"authority" cql:"authority"`
	FirstName       string   `json:"first_name" cql:"first_name"`
	Api_key   string   `json:"api_key" cql:"api_key"`
	LastName      string   `json:"last_name" cql:"last_name"`
	Password      string   `json:"last_name" cql:"last_name"`
	Password_reset_key     string   `json:"password_reset_key" cql:"password_reset_key"`
	Password_reset_sent_at      string   `json:"password_reset_sent_at" cql:"password_reset_sent_at"`
	Phone      string  `json:"phone" cql:"phone"`
	Status     string   `json:"status" cql:"status"`
	CreatedAt  string   `json:"created_at" cql:"created_at"`
}
