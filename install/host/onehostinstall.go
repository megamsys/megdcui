package host

import (
  "io"
   "os"
   "bytes"
   "fmt"
  "github.com/megamsys/megdc/handler"
  )


var OneHost = []string{"OneHostInstall"}

type Onehostinstall struct {
	Host string
	Username string
	Password string
}

func (i *Onehostinstall) InstallOneHost(host, username, password string) error {
  var outBuffer bytes.Buffer
 writer := io.MultiWriter(&outBuffer, os.Stdout)
 fmt.Printf("Before sent %#v:",outBuffer)

	z :=Onehostinstall{ Host: host, Username: username, Password: password}

  f := handler.NewWrap(&z)
  f.IfNoneAddPackages(INSTALL_PACKAGES)
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
