import Ember from 'ember';

export default Ember.Service.extend({
ajax: Em.inject.service(),
create(infos) {
    console.log(infos);
    return this.get('ajax').request('/hostinfos/content', {
        method: 'POST',
        data: JSON.stringify(infos)
      });
    /*return [
          {
            Status:"success",
             Statusmsg: "",
             IP: "103.56.92.23",
             Password: "megam",
             UserName: "megam",
             Cpu: "12",
             FileSystem: "ext4",
             Disks: [
               {
                 Disk: "sda",
                 Type: "disk",
                 Point: "",
                 Size: "5.5T",
               },
               {
                 Disk: "sda1",
                 Type: "part",
                 Point: "/storage1",
                 Size: "5.5T",
               },
               {
                 Disk: "sdb",
                 Type: "disk",
                 Point: "",
                 Size: "5.5T",
               },
               {
                 Disk: "sdb1",
                 Type: "part",
                 Point: "/storage2",
                 Size: "5.5T",
               }
             ]
           },
           {
             Status:"success",
             Statusmsg: "",
             IP: "103.56.92.25",
             Password: "megam",
             UserName: "megam",
             Cpu: "12",
             FileSystem: "xfs",
             Disks: [
               {
                 Disk: "sda",
                 Type: "disk",
                 Point: "",
                 Size: "5.5T",
               },
               {
                 Disk: "sda1",
                 Type: "part",
                 Point: "/storage1",
                 Size: "5.5T",
               },
               {
                 Disk: "sdb",
                 Type: "disk",
                 Point: "",
                 Size: "5.5T",
               },
               {
                 Disk: "sdb1",
                 Type: "part",
                 Point: "/storage2",
                 Size: "5.5T",
               }
             ]
           },
         ];*/
}

});
