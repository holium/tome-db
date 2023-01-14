/-  *tome
|_  act=kv-action
++  grow
  |%
  ++  noun  act
  --
++  grab
  |%
  ++  noun  kv-action
  ++  json
    =,  dejs:format
    |=  jon=json
    ^-  kv-action
    %.  jon
    %-  of
    :~  set-value/(ot ~[space/so app/so bucket/so key/so value/so])
        remove-value/(ot ~[space/so app/so bucket/so key/so])
        clear-kv/(ot ~[space/so app/so bucket/so])
    ==
  --
++  grad  %noun
--