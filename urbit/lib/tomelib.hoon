/-  *tome
|%
++  dejs  =,  dejs:format
  |%
  ++  kv-action
    |=  jon=json
    ^-  ^kv-action
    %.  jon
    %-  of
    :~  set-value/(ot ~[space/so app/so bucket/so key/so value/so])
        remove-value/(ot ~[space/so app/so bucket/so key/so])
        clear-kv/(ot ~[space/so app/so bucket/so])
    ==
  --
++  enjs  =,  enjs:format
  |%
  ++  kv-update
    |=  upd=^kv-update
    ^-  json
    ?-  -.upd
        %set      (frond key.upd s+value.upd)
        %remove   (frond key.upd ~)
        %clear    (pairs ~)
        %get      value.upd
        %all      o+data.upd
    ==
  --
--