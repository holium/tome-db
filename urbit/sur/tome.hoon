|%
+$  space         @tas       :: space name.  if no space this is 'our'
+$  app           @tas       :: app name (reduce namespace collisions).  if no app this is 'all'
+$  bucket        @tas       :: bucket name (with its own permissions).  if no bucket this is 'def'
+$  key           @t         :: key name
+$  value         @t
+$  json-value    [%s value] :: value (JSON encoded as a string).  Store with %s so we aren't constantly adding it to requests.
+$  ships    (set @p)
+$  invited  [read=ships write=ships admin=ships]
::
+$  level
  $%  %our
      %moon
      %space
      %open
  ==
::
+$  meta
  $:  created-by=@p
      updated-by=@p
      created-at=@da
      updated-at=@da
  ==
::
+$  perm     [read=level write=level admin=level]
+$  kv-data  (map key json-value)
+$  kv-meta  (map key meta)
+$  store    (map bucket [=perm whitelist=invited blacklist=invited meta=kv-meta data=kv-data])
::
:: =log =feed =counter etc.
:: "invited" is in addition to the basic permission level.
::  ex. if read is %space and someone not in our space attempts to read,
::  we will also check the read invite list before rejecting.
::
+$  tome-data   [=store]
::
+$  tome-action  :: these can only be done by the host, so we don't include the ship for now.
  $%  [%init-tome =space =app]
      [%init-kv =space =app =bucket =perm]
  ==
::
+$  kv-action
  $%  [%set-value ship=@t =space =app =bucket =key =value]
      [%remove-value ship=@t =space =app =bucket =key]
      [%clear-kv ship=@t =space =app =bucket]
  ==
::
+$  kv-update
  $%  [%set =key =value]
      [%remove =key]
      [%clear ~]
      [%get value=?(~ json-value)]
      [%all data=kv-data]
  ==
--

