|%
+$  space         @tas              :: space name.  if no space this is 'our'
+$  app           @tas              :: app name (reduce namespace collisions).  if no app this is 'all'
+$  bucket        @tas              :: bucket name (with its own permissions).  if no bucket this is 'def'
+$  key           @t                :: key name
+$  value         @t
+$  json-value    [%s value]        :: value (JSON encoded as a string).  Store with %s so we aren't constantly adding it to requests.
+$  id            (pair ship time)  :: unique id for each entry in a feed (including replies)
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
+$  reply-value
  $:  created-at=time
      updated-at=time
      author=ship
      content=json-value
  ==
::
+$  replies  ((mop time reply-value) gth)
+$  feed-value
  $:  created-at=time
      updated-at=time
      author=ship
      content=json-value
      =replies
      reactions=(map ship json-value)
  ==
::
+$  feed-data  ((mop time feed-value) gth)
::  if "locked", %write permissions can only add, not edit or delete.
::  this makes it act like a log.  (admins can still edit or delete anything).
+$  feed       (map bucket [=perm whitelist=invited blacklist=invited locked=_| data=feed-data])
::
:: =log =feed =counter etc.
:: "invited" is in addition to the basic permission level.
::  ex. if read is %space and someone not in our space attempts to read,
::  we will also check the read invite list before rejecting.
::
+$  tome-data   [=store =feed]
::
+$  tome-action
  $%  [%init-tome ship=@t =space =app]
      [%init-kv ship=@t =space =app =bucket =perm]
      :: [%unwatch-kv ship=@t =space =app =bucket] someday...
      [%init-feed ship=@t =space =app =bucket locked=? =perm]
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
:: +$  feed-action
::   $%
::   ==
--

