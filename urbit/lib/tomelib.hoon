/-  *tome
|%
++  dejs  =,  dejs:format
  |%
  ++  kv-action
    |=  jon=json
    ^-  ^kv-action
    %.  jon
    %-  of
    :~  set-value/(ot ~[ship/so space/so app/so bucket/so key/so value/so])
        remove-value/(ot ~[ship/so space/so app/so bucket/so key/so])
        clear-kv/(ot ~[ship/so space/so app/so bucket/so])
        verify-kv/(ot ~[ship/so space/so app/so bucket/so])
        watch-kv/(ot ~[ship/so space/so app/so bucket/so])
        team-kv/(ot ~[ship/so space/so app/so bucket/so])
    ==
  ::
  ++  feed-action
    |=  jon=json
    ^-  ^feed-action
    %.  jon
    %-  of
    :~  new-post/(ot ~[ship/so space/so app/so bucket/so log/bo id/so content/so])
        delete-post/(ot ~[ship/so space/so app/so bucket/so log/bo id/so])
        edit-post/(ot ~[ship/so space/so app/so bucket/so log/bo id/so content/so])
        clear-feed/(ot ~[ship/so space/so app/so bucket/so log/bo])
        verify-feed/(ot ~[ship/so space/so app/so bucket/so log/bo])
        watch-feed/(ot ~[ship/so space/so app/so bucket/so log/bo])
        team-feed/(ot ~[ship/so space/so app/so bucket/so log/bo])
        :: these don't work because ?????
        :: set-post-link/(ot ~[ship/so space/so app/so bucket/so log/so id/so value/so])
        :: remove-post-link/(ot ~[ship/so space/so app/so bucket/so log/so id/so])
    ==
  ::
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
        %perm     (pairs ~[[%read s+read.perm.upd] [%write s+write.perm.upd] [%admin s+admin.perm.upd]])
    ==
  --
--