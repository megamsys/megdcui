package accounts

import (
	"encoding/json"
//  "fmt"
//  ldb "github.com/megamsys/libgo/db"
//	constants "github.com/megamsys/libgo/utils"
)

const ACCOUNTSBUCKET = "accounts"

type Accounts struct {
	Id                  string `json:"id" cql:"id"`
	FirstName           string `json:"first_name" cql:"first_name"`
	LastName            string `json:"last_name" cql:"last_name"`
	Phone               string `json:"phone" cql"phone"`
	Email               string `json:"email" cql:"email"`
	ApiKey              string `json:"api_key" cql:"api_key"`
	Password            string `json:"password" cql:"password"`
	Authority           string `json:"authority" cql:"authority"`
	PasswordResetKey    string `json:"password_reset_key" cql:"password_reset_key"`
	PasswordResetSentAt string `json:"password_reset_sent_at" cql:"password_reset_sent_at"`
	Status              string `json:"status" cql:"status"`
}

func NewAccount(data []byte) (*Accounts, error) {
  t := &Accounts{}
  err := json.Unmarshal(data, t)
    if err != nil {
        return t, err
    }
  return t, nil
}

func (a *Accounts) Create() error {


  return nil
}

func (a *Accounts) Login() error {

  return nil
}
