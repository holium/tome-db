/-  membership, spc=spaces-path
|%
::
:: +$  passport
::   $:  =roles:membership
::       alias=cord
::       status=status:membership
::   ==
:: ::
:: ::  $passports: passports (access) to spaces within Realm
:: +$  passports      (map ship passport)
:: ::
:: ::  $districts: subdivisions of the entire realm universe
:: +$  districts     (map path=path:spaces passports)
::

+$  invitations           (map path:spc invite)
+$  invite
  $:  inviter=ship
      path=path:spc
      role=role:membership
      message=cord
      name=name:spc
      type=?(%group %space %our)
      picture=@t
      color=@t 
      invited-at=@da
  ==
::

+$  action
  $%  [%send-invite path=path:spc =ship =role:membership message=@t]
      [%accept-invite path=path:spc]
      [%decline-invite path=path:spc]
      [%invited path=path:spc =invite]
      [%stamped path=path:spc]
      [%kick-member path=path:spc =ship]
      [%revoke-invite path=path:spc]
  ==

+$  reaction
  $%  [%invite-sent path=path:spc =ship =invite =member:membership]
      [%invite-received path=path:spc =invite]
      [%invite-removed path=path:spc]
      [%invite-accepted path=path:spc =ship =member:membership]
      [%kicked path=path:spc =ship]
  ==
::
+$  view
  $%  [%invitations invites=invitations]
  ==
::
--