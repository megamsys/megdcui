package install



import (
  "bytes"
	"reflect"
	"strings"
	"text/tabwriter"
	"github.com/megamsys/libgo/cmd"
  "fmt"
)
type WrappedParms struct {
	Packages map[string]string
	Options  map[string]string
	Maps     map[string][]string
}

func (w *WrappedParms) String() string {
  fmt.Println("NNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNNN")
	wt := new(tabwriter.Writer)
	var b bytes.Buffer
	wt.Init(&b, 0, 8, 0, '\t', 0)
	b.Write([]byte(cmd.Colorfy("Packages", "cyan", "", "") + "\n"))
	for _, v := range w.Packages {
		b.Write([]byte(v + "\n"))
	}
	b.Write([]byte(cmd.Colorfy("Options", "blue", "", "") + "\n"))
	for k, v := range w.Options {
		b.Write([]byte(k + "\t" + v + "\n"))
	}
	b.Write([]byte("---\n"))
	fmt.Fprintln(wt)
	wt.Flush()
	return strings.TrimSpace(b.String())
}

func NewWrap(c interface{}) *WrappedParms {
	fmt.Println("NEW&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&")
	w := WrappedParms{}
	packages := make(map[string]string)
	options := make(map[string]string)
  fmt.Println(options)
  maps := make(map[string][]string)
	s := reflect.ValueOf(c).Elem()
  fmt.Println("ref$$$$$$$$$$$$$$$$$$$$$$$$$")
  //fmt.Println(s)
	typ := s.Type()
  fmt.Println(typ)
	if s.Kind() == reflect.Struct {
		for i := 0; i < s.NumField(); i++ {
			key := s.Field(i)
			value := s.FieldByName(typ.Field(i).Name)
      fmt.Println("Type*****************************")
      fmt.Println(key)
      fmt.Println(value)
      fmt.Println(key.Interface())
			switch key.Interface().(type) {
			case bool:
fmt.Println("BO&&&&&&&&&&&&&&&&&&&&&&&&&&&")
				if value.Bool() {

					packages[typ.Field(i).Name] = typ.Field(i).Name
				}
			case string:
        fmt.Println("------------------")
				if value.String() != "" {

					options[typ.Field(i).Name] = value.String()
				}
			case cmd.MapFlag:
				c := make([]string, len(value.MapKeys()))
        if len(value.MapKeys()) > 0 {
					for k,v := range value.MapKeys() {
					   	c[k] = value.MapIndex(v).String()
					}
          maps[typ.Field(i).Name] = c
				}
			}
		}
	}

	w.Packages = packages
	w.Options = options
	fmt.Println(w.Options)
	w.Maps    = maps
  fmt.Println("return-----------------------")
  fmt.Println(w)
	return &w

}
func (w *WrappedParms) len() int {
	return len(w.Packages)
}

func (w *WrappedParms) Empty() bool {
	return w.len() == 0
}

func (w *WrappedParms) IfNoneAddPackages(p []string) {
  fmt.Println("Package*********************")
  fmt.Println(w)
	if w.Empty() {
		for i := range p {
			w.addPackage(p[i])
		}
	}
}

func (w *WrappedParms) addPackage(k string) {
  fmt.Println("addpack++++++++++++++++++")
  fmt.Println(w)
	w.Packages[k] = k
  fmt.Println(k)
}
func (w *WrappedParms) GetHost() (string, bool) {
	k, v := w.Options[HOST]
	return k, v
}

func (w *WrappedParms) GetUserName() (string, bool) {
	k, v := w.Options[USERNAME]
	return k, v
}

func (w *WrappedParms) GetPassword() (string, bool) {
	k, v := w.Options[PASSWORD]
	return k, v
}
