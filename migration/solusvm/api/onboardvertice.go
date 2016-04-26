package api

import (
  "fmt"
  "math/rand"
	//"testing"
	"time"
  log "github.com/Sirupsen/logrus"
  ldb "github.com/megamsys/libgo/db"
  atmn "github.com/megamsys/megdcui/automation"
  "github.com/megamsys/solusvm_go/solusvm"
  "github.com/megamsys/megdcui/meta"
)
const (
	ASSEMBLY = "assembly"
  ASSEMBLIES = "assemblies"
	SSHKEY         = "sshkey"
  ACCOUNTS       = "accounts"
  ORGANIZATIONS  = "organizations"
  DOMAINS        = "domains"
  //LetterRunes    = "abcdefghijklmnopqrstuvwxyz0123456789"
  //NumberRunes    = "0123456789"
)


func init() {
    rand.Seed(time.Now().UnixNano())
}

var letterRunes = []rune("abcdefghijklmnopqrstuvwxyz0123456789")
var numberRunes = []rune("0123456789")

func SendClientToScylla(acts *atmn.Account) (err error) {
	started := time.Now()
		ops := ldb.Options{
			TableName:   ACCOUNTS,
			Pks:         []string{},
			Ccms:        []string{"email"},
			Hosts:       meta.MC.Scylla,
			Keyspace:    meta.MC.ScyllaKeyspace,
			PksClauses:  make(map[string]interface{}),
			CcmsClauses: map[string]interface{}{"email": acts.Email},
		}
		if err = ldb.Storedb(ops, acts); err != nil {
			log.Debugf(err.Error())
      return err
		}
    log.Debugf("sent %s 's accounts to scylla  %.06f\n",acts.FirstName ,time.Since(started).Seconds())
   return nil
}

func SendOrgsToScylla(orgs *atmn.Organizations) (err error) {
		ops := ldb.Options{
			TableName:   ORGANIZATIONS,
			Pks:         []string{"id"},
			Ccms:        []string{"accounts_id"},
			Hosts:       meta.MC.Scylla,
			Keyspace:    meta.MC.ScyllaKeyspace,
			PksClauses:  map[string]interface{}{"id": orgs.Id},
			CcmsClauses: map[string]interface{}{"accounts_id": orgs.AccountsId},
		}

		if err = ldb.Storedb(ops, orgs); err != nil {
			log.Debugf(err.Error())
      return err
		}
    log.Debugf("sent %s 's Organizations to scylla  %.06f\n", time.Since(time.Now()).Seconds())
   return nil
}

func SendAsmToScylla(asm *atmn.Ambly) (err error) {
		ops := ldb.Options{
			TableName:   ASSEMBLY,
			Pks:         []string{"id"},
			Ccms:        []string{"org_id"},
			Hosts:       meta.MC.Scylla,
			Keyspace:    meta.MC.ScyllaKeyspace,
			PksClauses:  map[string]interface{}{"id": asm.Id},
			CcmsClauses: map[string]interface{}{"org_id": asm.OrgId},
		}

		if err = ldb.Storedb(ops, asm); err != nil {
			log.Debugf(err.Error())
      return err
		}
    log.Debugf("sent %s 's Assembly to scylla  %.06f\n", time.Since(time.Now()).Seconds())
   return nil
}




func SendAmsToScylla(ams *atmn.Assemblies) (err error) {
		ops := ldb.Options{
			TableName:   ASSEMBLIES,
			Pks:         []string{"id"},
			Ccms:        []string{"org_id"},
			Hosts:       meta.MC.Scylla,
			Keyspace:    meta.MC.ScyllaKeyspace,
			PksClauses:  map[string]interface{}{"id": ams.Id},
			CcmsClauses: map[string]interface{}{"org_id": ams.OrgId},
		}

		if err = ldb.Storedb(ops, ams); err != nil {
			log.Debugf(err.Error())
      return err
		}
    log.Debugf("sent %s 's Assemblys to scylla  %.06f\n", time.Since(time.Now()).Seconds())
   return nil
}

func getOrgId(email string) (*atmn.Organizations, error) {
	a := &atmn.Organizations{}
	ops := ldb.Options{
		TableName:   ORGANIZATIONS,
		Pks:         []string{},
		Ccms:        []string{},
		Hosts:       meta.MC.Scylla,
		Keyspace:    meta.MC.ScyllaKeyspace,
		PksClauses:  make(map[string]interface{}),
		CcmsClauses: map[string]interface{}{"accounts_id": email},
	}
	if err := ldb.Fetchdb(ops, a); err != nil {
		return nil, err
	}
	return a, nil
}

func CollectionChannel(this *solusvm.SClients) chan solusvm.SolusClient {
    dataChannel := make(chan solusvm.SolusClient, len(*this.SolusClients))
    for _, cl := range *this.SolusClients {
        dataChannel <- cl
    }
    close(dataChannel)

    return dataChannel
}

func storeVirtualMachine(vm *solusvm.VirtualServer,orgid string) (error){

  assemly  := parseAssembly(orgid,vm)
  assemlies  := parseAssemblies(orgid,assemly.Id)
  err := SendAsmToScylla(assemly)
  if err !=nil {
    fmt.Println(err)
    return err
  }
   err = SendAmsToScylla(assemlies)
  if err !=nil {
    fmt.Println(err)
  }
      fmt.Printf("vertice Onboard VM : %s success \n", *vm.Vserverid)

  return nil
}

func storeAccounts(clients *solusvm.SClients) (error) {
    for clts := range CollectionChannel(clients) {
    acts  := parseAccount(clts)
    orgs  := parseOrganization(*clts.Email,*clts.Company)
    err := SendClientToScylla(acts)
    if err !=nil {
      fmt.Println(err)
      return err
    }
   err = SendOrgsToScylla(orgs)
    if err !=nil {
      fmt.Println(err)
    }
        fmt.Printf("vertic Onboard User : %s success \n", *clts.FirstName)
    }
    return nil
}

func RandNumberRunes(n int) string {
    b := make([]rune, n)
    for i := range b {
        b[i] = numberRunes[rand.Intn(len(numberRunes))]
    }
    return string(b)
}

func RandStringRunes(n int) string {
    b := make([]rune, n)
    for i := range b {
        b[i] = letterRunes[rand.Intn(len(letterRunes))]
    }
    return string(b)
}
