package meta

import (
	//"github.com/BurntSushi/toml"
	"gopkg.in/check.v1"
)

// Ensure the configuration can be parsed.
func (s *S) TestMetaConfig_Parse(c *check.C) {
	// Parse configuration.
	/*var cm Config
	if _, err := toml.Decode(`
dir = "/var/lib/megam/vertice/meta"
scylla = ["103.56.92.24"]
scylla_keyspace = "vertice"
`, &cm); err != nil {
		c.Fatal(err)
	}
	c.Assert(cm.Dir, check.Equals, "/var/lib/megam/vertice/meta")
	*/
}
