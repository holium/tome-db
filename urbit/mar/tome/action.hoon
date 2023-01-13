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
    =*  levels  (su (perk [%our %team %space %open ~]))
    ^-  tome-action
    %.  jon
    %-  of
    :~  init-tome/(ot ~[space/so app/so perm/(ot ~[read/levels create/levels overwrite/levels])])
        init-kv/(ot ~[space/so app/so])
    ==
  --
++  grad  %noun
--