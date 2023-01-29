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
    =*  levels  (su (perk [%our %space %open %unset %yes %no ~]))
    ^-  tome-action
    %.  jon
    %-  of
    :~  init-tome/(ot ~[ship/so space/so app/so])
        init-kv/(ot ~[ship/so space/so app/so bucket/so perm/(ot ~[read/levels write/levels admin/levels])])
        init-feed/(ot ~[ship/so space/so app/so bucket/so log/bo perm/(ot ~[read/levels write/levels admin/levels])])
    ==
  --
++  grad  %noun
--