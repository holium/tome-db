|%
+$  space         @tas              :: space name.  if no space this is 'our'
+$  app           @tas              :: app name (reduce namespace collisions).  if no app this is 'all'
+$  bucket        @tas              :: bucket name (with its own permissions).  if no bucket this is 'def'
+$  key           @t                :: key name
+$  value         @t                :: value in kv store
+$  content       @t                :: content for feed post / reply
+$  id            @t                :: uuid for feed post
+$  json-value    [%s value]        :: value (JSON encoded as a string).  Store with %s so we aren't constantly adding it to requests.
+$  ships         (set ship)
+$  invited       [read=ships write=ships admin=ships]
::
+$  level
  $%  %our
      %space
      %open
      %unset
      %yes
      %no
  ==
::
+$  meta
  $:  created-by=ship
      updated-by=ship
      created-at=time
      updated-at=time
  ==
::
+$  perm     [read=level write=level admin=level]
::
+$  kv-data  (map key json-value)
+$  kv-meta  (map key meta)
+$  store    (map bucket [=perm whitelist=invited blacklist=invited meta=kv-meta data=kv-data])
::
+$  feed-ids  (map id time)
::
:: +$  replies     ((mop time reply-value) gth)
+$  links   (map ship json-value)
::
:: +$  reply-value
::   $:  created-at=time
::       updated-at=time
::       author=ship
::       content=json-value
::       =links
::   ==
::
+$  feed-value
  $:  =id
      created-by=ship
      updated-by=ship
      created-at=time
      updated-at=time
  ::
      content=json-value
      :: =replies
      =links
  ==
::
+$  log  ?
+$  feed-data  ((mop time feed-value) gth)
::  if "log", %write permissions can only add, not edit or delete.
::  this makes it act like a log.  (admins can still edit or delete anything).
+$  feed       (map (pair =bucket =log) [=perm ids=feed-ids whitelist=invited blacklist=invited data=feed-data])
::
+$  tome-data  [=store =feed]
::
::  Actions and updates
::
+$  tome-action
  $%  [%init-tome ship=@t =space =app]
      [%init-kv ship=@t =space =app =bucket =perm]
      :: [%unwatch-kv ship=@t =space =app =bucket] someday...
      [%init-feed ship=@t =space =app =bucket =log =perm]
  ==
::
+$  kv-action
    :: thisShip -> tomeShip
  $%  [%set-value ship=@t =space =app =bucket =key =value]
      [%remove-value ship=@t =space =app =bucket =key]
      [%clear-kv ship=@t =space =app =bucket]
      [%verify-kv ship=@t =space =app =bucket]
    :: thisShip -> thisShip
      [%watch-kv ship=@t =space =app =bucket]
      [%team-kv ship=@t =space =app =bucket]
  ==
::
+$  kv-update
  $%  [%set =key =value]
      [%remove =key]
      [%clear ~]
      [%get value=?(~ json-value)]
      [%all data=kv-data]
      [%perm =perm]
  ==
::
+$  feed-action
  ::  top level actions (on posts)
  ::  %set-x becomes %new or %edit. Otherwise actions are similar to kv.
  ::  thisShip -> tomeShip
  $%  [%new-post ship=@t =space =app =bucket =log =id =content]
      [%delete-post ship=@t =space =app =bucket =log =id]
      [%edit-post ship=@t =space =app =bucket =log =id =content]
      [%clear-feed ship=@t =space =app =bucket =log]
      [%verify-feed ship=@t =space =app =bucket =log]
  :: thisShip -> thisShip
      [%watch-feed ship=@t =space =app =bucket =log]
      [%team-feed ship=@t =space =app =bucket =log]
  ::  actions for links (anything a foreign ship wants to associate with a post)
      [%set-post-link ship=@t =space =app =bucket =log =id =value]      :: src.bol is the ship to set the link for
      [%remove-post-link ship=@t =space =app =bucket =log =id]          :: only you can do this currently (uses src.bol for ship to remove)
  ::  actions on replies
      :: [%add-reply ship=@t =space =app =bucket =log post=id =value]
  ==
::
:: +$  feed-update
::   $%
::   ==
--

