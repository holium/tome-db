/-  *tome
|_  upd=kv-update
++  grab
  |%
  ++  noun  kv-update
  --
++  grow
  |%
  ++  noun  upd
  ++  json
    =,  enjs:format
    ^-  ^json
    ?-  -.upd
        %set      (frond key.upd s+value.upd)
        %remove   (frond key.upd ~)
        %clear    (pairs ~)
        %get      value.upd
        %all      o+data.upd
    ==
  --
++  grad  %noun
--