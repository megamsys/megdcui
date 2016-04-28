package host

import (
  "io"
   "os"
   "bytes"
   "fmt"
  "github.com/megamsys/megdc/handler"
  )


var INSTALL_PACKAGE= []string{"HostCheck"}

type HostCheck struct {
	All              bool
	HostCheck    bool
	Host string
	Username string
	Password string
}

func (i *HostCheck) GetHostCheck(host, username, password string) error {
  var outBuffer bytes.Buffer
  writer := io.MultiWriter(&outBuffer, os.Stdout)
  fmt.Printf("Before sent %#v:",outBuffer)

	z :=HostCheck{ All: false, HostCheck: false, Host: host, Username: username, Password: password}

  f := handler.NewWrap(&z)
  f.IfNoneAddPackages(INSTALL_PACKAGE)
	if h, err := handler.NewHandler(f); err != nil {
		return err
	} else if err := h.Run(writer); err != nil {
		return err
	}
  w, _ := os.Create("/home/dat2")
  n2, _ := w.Write(outBuffer.Bytes())
  //fmt.Print(writer.String())
  fmt.Printf("%#v",writer)
  fmt.Println(n2)
	return nil
}
