/-  *tome
|_  act=tome-action
++  grow
  |%
  ++  noun  act
  --
++  grab
  |%
  ++  noun  tome-action
  ++  json
    =,  dejs:format
    |=  jon=json
    =*  levels  (su (perk [%our %moon %space %open ~]))
    ^-  tome-action
    %.  jon
    %-  of
    :~  init-tome/(ot ~[space/so app/so])
        init-kv/(ot ~[space/so app/so bucket/so perm/(ot ~[read/levels write/levels admin/levels])])
    ==
  --
++  grad  %noun
--