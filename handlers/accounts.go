package handlers

import (
	"net/http"
  //"io/ioutil"
  "encoding/json"
	//"fmt"
  acc "github.com/megamsys/megdcui/handlers/accounts"
)

func Accounts(w http.ResponseWriter, r *http.Request) error {
  /*body, err := ioutil.ReadAll(r.Body)
    if err != nil {
      http.Error(w, err.Error(), 400)
      return err
    }

  a, accerr := acc.NewAccount(body)
	fmt.Println("--------------new account-----------")
	fmt.Println(a)
  if accerr != nil {
    http.Error(w, accerr.Error(), 500)
    return accerr
  }
	fmt.Println("--------------after new account-----------")
	fmt.Println(a)
  err = a.Create()
  if err != nil {
    http.Error(w, err.Error(), 500)
    return err
  }
	*/
	a := acc.Accounts{FirstName: "raj"}
  js, jserr := json.Marshal(a)
  if jserr != nil {
    http.Error(w, jserr.Error(), 500)
    return jserr
  }

  w.Header().Set("Content-Type", "application/json")
  w.Write(js)
  return nil
}
