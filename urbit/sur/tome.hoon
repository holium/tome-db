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
+$  invited       (map ship invite-level)
::
+$  perm-level
  $%  %our
      %space
      %open
      %unset
      %yes
      %no
  ==
::
+$  invite-level
  $%  %read
      %write
      %admin
      %block
  ==
::
+$  meta
  $:  created-by=ship
      updated-by=ship
      created-at=time
      updated-at=time
  ==
::
+$  perm     [read=perm-level write=perm-level admin=perm-level]
::
+$  kv-data  (map key json-value)
+$  kv-meta  (map key meta)
+$  store    (map bucket [=perm invites=invited meta=kv-meta data=kv-data])
::
+$  feed-ids  (map id time)
::
:: +$  replies     ((mop time reply-value) gth)
+$  links   (map @t json-value)
::
:: +$  reply-value
::   $:  created-by=ship
      :: updated-by=ship
      :: created-at=time
::       updated-at=time
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
+$  feed       (map (pair =bucket =log) [=perm ids=feed-ids invites=invited data=feed-data])
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
    :: can be sent by any ship
  $%  [%set-value ship=@t =space =app =bucket =key =value]
      [%remove-value ship=@t =space =app =bucket =key]
      [%clear-kv ship=@t =space =app =bucket]
      [%verify-kv ship=@t =space =app =bucket]
  :: must not be Tome owner (these are proxies for watching a foreign Tome)
      [%watch-kv ship=@t =space =app =bucket]
      [%team-kv ship=@t =space =app =bucket]
  :: must be Tome owner (manage permissions and invites)
      [%perm-kv ship=@t =space =app =bucket =perm]
      [%invite-kv ship=@t =space =app =bucket guy=@t level=invite-level]
  ==
::
+$  kv-update
  $%  [%set =key =value]
      [%remove =key]
      [%clear ~]
    ::
      [%get value=?(~ json-value)]
      [%all data=kv-data]
      [%perm write=?(%yes %no) admin=?(%yes %no)]
  ==
::
+$  feed-action
  :: can be sent by any ship
  $%  [%new-post ship=@t =space =app =bucket =log =id =content]
      [%edit-post ship=@t =space =app =bucket =log =id =content]
      [%delete-post ship=@t =space =app =bucket =log =id]
      [%clear-feed ship=@t =space =app =bucket =log]
      [%verify-feed ship=@t =space =app =bucket =log]
  :: must not be Tome owner (these are proxies for watching a foreign Tome)
      [%watch-feed ship=@t =space =app =bucket =log]
      [%team-feed ship=@t =space =app =bucket =log]
  :: must be Tome owner (manage permissions and invites)
      [%perm-feed ship=@t =space =app =bucket =log =perm]
      [%invite-feed ship=@t =space =app =bucket =log guy=@t level=invite-level]
  ::  actions for links (anything a foreign ship wants to associate with a post)
      [%set-post-link ship=@t =space =app =bucket =log =id =value]
      [%remove-post-link ship=@t =space =app =bucket =log =id]
  ==
::
+$  feed-update
  $%  [%new =id =time =ship =content]  :: ship is author, time is post time
      [%edit =id =time =ship =content]  :: ship is who updated, time is update time
      [%delete =id =time]
      [%clear ~]
    ::
      [%set-link =id =time ship=@t =value] :: these are @t to make returning them easier
      [%remove-link =id =time ship=@t]
    ::
      [%get post=?(~ feed-value)]
      [%all data=feed-data]
      [%perm write=?(%yes %no) admin=?(%yes %no)]
  ==
::
--

