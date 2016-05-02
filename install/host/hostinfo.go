package host

import (
  "io"
   "os"
   "bytes"
   "fmt"
  "github.com/megamsys/megdc/handler"
  )


var INSTALL_PACKAGES = []string{"HostInfo"}

type HostInfo struct {

	All              bool
	HostInfo    bool
	Host string
	Username string
	Password string
}

func (i *HostInfo) GetHostInfo(host, username, password string) error {
  var outBuffer bytes.Buffer
 writer := io.MultiWriter(&outBuffer, os.Stdout)
 fmt.Printf("Before sent %#v:",outBuffer)

	z :=HostInfo{ All: false, HostInfo: false, Host: host, Username: username, Password: password}

  f := handler.NewWrap(&z)
  f.IfNoneAddPackages(INSTALL_PACKAGES)
	if h, err := handler.NewHandler(f); err != nil {
		return err
	} else if err := h.Run(writer); err != nil {
		return err
	}

  s := outBuffer.String()
  fmt.Println(s)
	return nil
}
