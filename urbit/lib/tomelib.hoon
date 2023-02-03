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
        edit-post/(ot ~[ship/so space/so app/so bucket/so log/bo id/so content/so])
        delete-post/(ot ~[ship/so space/so app/so bucket/so log/bo id/so])
        clear-feed/(ot ~[ship/so space/so app/so bucket/so log/bo])
        verify-feed/(ot ~[ship/so space/so app/so bucket/so log/bo])
        watch-feed/(ot ~[ship/so space/so app/so bucket/so log/bo])
        team-feed/(ot ~[ship/so space/so app/so bucket/so log/bo])
        set-post-link/(ot ~[ship/so space/so app/so bucket/so log/bo id/so value/so])
        remove-post-link/(ot ~[ship/so space/so app/so bucket/so log/bo id/so])
    ==
  --
++  enjs  =,  enjs:format
  |%
  ++  kv-update
    |=  upd=^kv-update
    ^-  json
    ?-  -.upd
      %set     (frond key.upd s+value.upd)
      %remove  (frond key.upd ~)
      %clear   (pairs ~)
      %get     value.upd
      %all     o+data.upd
      %perm    (pairs ~[[%read s+read.perm.upd] [%write s+write.perm.upd] [%admin s+admin.perm.upd]])
    ==
  ::
  ++  feed-convert
    |=  x=[k=@da v=feed-value]
    ^-  json
    %-  pairs
    :~  [%id s+id.v.x]
        [%'createdBy' s+(scot %p created-by.v.x)]
        [%'updatedBy' s+(scot %p updated-by.v.x)]
        [%'createdAt' (time created-at.v.x)]
        [%'updatedAt' (time updated-at.v.x)]
        [%content content.v.x]
        :: [%links o+links.v.x]  :: TODO make links keys strings instead? probably just turn them here
    ==
  ::
  ++  feed-update
    |=  upd=^feed-update
    ^-  json
    ?-  -.upd
      %new          (pairs ~[[%type s+'new'] [%body (pairs ~[[%id s+id.upd] [%time (time time.upd)] [%ship s+(scot %p ship.upd)] [%content s+content.upd]])]])
      %edit         (pairs ~[[%type s+'edit'] [%body (pairs ~[[%id s+id.upd] [%time (time time.upd)] [%ship s+(scot %p ship.upd)] [%content s+content.upd]])]]) :: time is updated-time, ship is updated-by
      %delete       (pairs ~[[%type s+'delete'] [%body (pairs ~[[%id s+id.upd] [%time (time time.upd)]])]])
      %clear        (frond %type s+'clear')
      %set-link     (pairs ~[[%type s+'set-link'] [%body (pairs ~[[%id s+id.upd] [%time (time time.upd)] [%ship s+(scot %p ship.upd)] [%value s+value.upd]])]])
      %remove-link  (pairs ~[[%type s+'remove-link'] [%body (pairs ~[[%id s+id.upd] [%time (time time.upd)] [%ship s+(scot %p ship.upd)]])]])
      %get          value.upd
      %perm         (pairs ~[[%read s+read.perm.upd] [%write s+write.perm.upd] [%admin s+admin.perm.upd]])
        %all
      =/  fon        ((on @da feed-value) gth)  :: mop needs this to work
      =/  data-list  (tap:fon data.upd)
      :-  %a
      (turn data-list feed-convert)
    ==
  --
--