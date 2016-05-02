package handlers

import (
	"net/http"
  "io/ioutil"
  "encoding/json"
  acc "github.com/megamsys/megdcui/handlers/accounts"
)

func Accounts(w http.ResponseWriter, r *http.Request) error {
  body, err := ioutil.ReadAll(r.Body)
    if err != nil {
      http.Error(w, err.Error(), 400)
      return err
    }
    
  a, accerr := acc.NewAccount(body)
  if accerr != nil {
    http.Error(w, accerr.Error(), 500)
    return accerr
  }

  err = a.Create()
  if err != nil {
    http.Error(w, err.Error(), 500)
    return err
  }

  js, jserr := json.Marshal(a)
  if jserr != nil {
    http.Error(w, jserr.Error(), 500)
    return jserr
  }

  w.Header().Set("Content-Type", "application/json")
  w.Write(js)
  return nil
}
