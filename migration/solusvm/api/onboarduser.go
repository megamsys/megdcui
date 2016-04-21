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
	ASSEMBLYBUCKET = "assembly"
  ASSEMBLIESBUCKET = "assemblies"
	SSHKEY         = "sshkey"
  ACCOUNTS       = "accounts"
  ORGANIZATIONS  = "organizations"
  DOMAINS        = "domains"
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
			Pks:         []string{"Id"},
			Ccms:        []string{"Account_Id"},
			Hosts:       meta.MC.Scylla,
			Keyspace:    meta.MC.ScyllaKeyspace,
			PksClauses:  map[string]interface{}{"Id": orgs.Id},
			CcmsClauses: map[string]interface{}{"Account_Id": orgs.AccountsId},
		}

		if err = ldb.Storedb(ops, orgs); err != nil {
			log.Debugf(err.Error())
      return err
		}
    log.Debugf("sent %s 's Organizations to scylla  %.06f\n", time.Since(time.Now()).Seconds())
   return nil
}


func CollectionChannel(this *solusvm.SClients) chan solusvm.SolusClient {
    dataChannel := make(chan solusvm.SolusClient, len(*this.SolusClients))
    for _, cl := range *this.SolusClients {
        dataChannel <- cl
    }
    close(dataChannel)

    return dataChannel
}

func storeAccounts(clients *solusvm.SClients) (error) {
    for clts := range CollectionChannel(clients) {
    acts  := parseAccount(clts)
  //  orgs  := parseOrganization(*clts.Email,*clts.Company)
    err := SendClientToScylla(acts)
    if err !=nil {
      fmt.Println(err)
      return err
    }
  /* err = SendOrgsToScylla(orgs)
    if err !=nil {
      fmt.Println(err)
    }*/
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
