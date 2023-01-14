|%
+$  space         @t         :: space name.  if no space this is 'our'
+$  app           @t         :: app name (reduce namespace collisions).  if no app this is 'all'
+$  bucket        @t         :: bucket name (with its own permissions).  if no bucket this is 'def'
+$  key           @t         :: key name
+$  value         @t
+$  json-value    [%s value] :: value (JSON encoded as a string).  Store with %s so we aren't constantly adding it to requests.
+$  ships    (unit (set @p))
+$  invited  (unit [read=ships write=ships admin=ships])
::
+$  level
  $%  %our
      %team
      %space
      %open
  ==
::
+$  meta
  $:  created-by=@p
      created-at=@da
      updated-by=@p
      updated-at=@da
  ==
::
+$  perm     [read=level write=level admin=level]
+$  kv       (map key json-value)
+$  kv-meta  (map key meta)
+$  store    (unit (map bucket [=perm whitelist=invited blacklist=invited meta=kv-meta data=kv]))
::
:: =log =feed =counter etc.
:: "invited" is in addition to the basic permission level.
::  ex. if read is %space and someone not in our space attempts to read,
::  we will also check the read invite list before rejecting.
::
+$  tome  (unit (map space (unit (map app [=store]))))
::
+$  tome-action
  $%  [%init-tome =space =app]
      [%init-kv =space =app =bucket =perm]
  ==
::
+$  kv-action
  $%  [%set-value =space =app =bucket =key =value]
      [%remove-value =space =app =bucket =key]
      [%clear-kv =space =app =bucket]
  ==
--

